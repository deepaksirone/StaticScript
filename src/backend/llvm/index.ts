import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {CPPMangler} from "./cpp.mangler";
import {Context} from "./context";
import {NativeTypeResolver} from "./native-type-resolver";
import UnsupportedError from "../error/unsupported.error";
import {NativeType} from "./native-type";
import {RUNTIME_DEFINITION_FILE} from "@static-script/runtime";
import {LANGUAGE_DEFINITION_FILE} from "../../constants";
import {CMangler} from "./c.mangler";
import {ManglerInterface} from "./mangler.interface";
import {
    ArrayReference,
    ClassReference,
    FunctionReference,
    ObjectReference,
    Primitive,
    Value,
    ValueTypeEnum
} from "./value";
import {BinaryExpressionCodeGenerator} from "./code-generation/binary-expression";
import {ReturnStatementCodeGenerator} from "./code-generation/return-statement";
import {ForStatementGenerator} from "./code-generation/for-statement";
import {DoStatementGenerator} from "./code-generation/do-statement";
import {WhileStatementGenerator} from "./code-generation/while-statement";
import {BreakStatementGenerator} from "./code-generation/break-statement";
import {ContinueStatementGenerator} from "./code-generation/continue-statement";
import {ClassDeclarationGenerator} from "./code-generation/class-statement";
import {NewExpressionGenerator} from "./code-generation/new-expression";
import {ArrayLiteralExpressionCodeGenerator} from "./code-generation/array-literal-expression";
import {ArrayLiteralExpression} from "typescript";
import {IfStatementCodeGenerator} from "./code-generation/if-statement";
import {CallExpressionCodeGenerator} from "./code-generation/call-expression";
import {PropertyAccessExpressionCodeGenerator} from "./code-generation/property-access-expression";
import {TryStatementGenerator} from "./code-generation/try-statement";
import {PostfixUnaryExpressionCodeGenerator} from "./code-generation/postfix-unary-expression";
import {FunctionDeclarationCodeGenerator} from "./code-generation/function-declaration";
import {TypeOfExpressionCodeGenerator} from "./code-generation/typeof-expression";
import {PrefixUnaryExpressionCodeGenerator} from "./code-generation/prefix-unary-expression";
import {ElementAccessExpressionGenerator} from "./code-generation/element-access-expression";
import { TemplateExpressionCodeGenerator } from "./code-generation/template-expression";
import { ConditionalExpressionCodeGenerator } from "./code-generation/conditional-expression";

export function emitCondition(
    condition: ts.Expression,
    ctx: Context,
    builder: llvm.IRBuilder,
    positiveBlock: llvm.BasicBlock,
    negativeBlock: llvm.BasicBlock,
) {
    const left = buildFromExpression(condition, ctx, builder);

    const conditionBoolValue = left.toBoolean(ctx, builder, condition);
    let loaded_val = loadIfNeeded(conditionBoolValue, builder);
    //builder.createCondBr(conditionBoolValue.getValue(), positiveBlock, negativeBlock);
    builder.createCondBr(loaded_val, positiveBlock, negativeBlock);
}

export function buildFromString(value: string, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        builder.createGlobalStringPtr(value),
        ValueTypeEnum.STRING
    );
}

export function buildFromStringValue(node: ts.StringLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return buildFromString(node.text, ctx, builder);
}

export function buildFromTemplateHeadMiddleOrTail(node: ts.TemplateMiddle | ts.TemplateTail | ts.TemplateHead, ctx: Context, builder: llvm.IRBuilder): Value {
    return buildFromString(node.text, ctx, builder);
}

export function buildFromRegularExpressionValue(node: ts.RegularExpressionLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        builder.createGlobalStringPtr(node.text),
        ValueTypeEnum.STRING
    );
}

export function buildFromTrueKeyword(node: ts.BooleanLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        llvm.ConstantInt.get(
            ctx.llvmContext,
            1,
            1,
            false
        ),
        ValueTypeEnum.BOOLEAN
    );
}

export function buildFromFalseKeyword(node: ts.BooleanLiteral, ctx: Context, builder: llvm.IRBuilder): Value {
    return new Primitive(
        llvm.ConstantInt.get(
            ctx.llvmContext,
            0,
            1,
            false
        ),
        ValueTypeEnum.BOOLEAN
    );
}

function buildFromNumericLiteral(
    value: ts.NumericLiteral,
    ctx: Context,
    builder: llvm.IRBuilder,
    nativeType?: NativeType
): Value {
    if (!nativeType || nativeType.getType().isDoubleTy()) {
        return new Primitive(
            llvm.ConstantFP.get(ctx.llvmContext, parseFloat(value.text)),
            ValueTypeEnum.DOUBLE
        );
    }

    return new Primitive(
        llvm.ConstantInt.get(
            ctx.llvmContext,
            parseInt(value.text),
            (<llvm.IntegerType>nativeType.getType()).getBitWidth(),
            nativeType.isSigned()
        ),
    );
}

function buildFromNullExpr(value: ts.NullLiteral, 
    ctx: Context,
    builder: llvm.IRBuilder): Value {
        return new Primitive(
            llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(ctx.llvmContext)),
            ValueTypeEnum.NULL
        );
}

function extractNameFromObjectType(
    type: ts.ObjectType
): string {
    const name = <string>type.symbol.escapedName;

    if (type.isClassOrInterface() && type.typeParameters) {
        return name + type.typeParameters.map((typeParameter: ts.TypeParameter) => {
            return <string>typeParameter.symbol.escapedName;
        }).join('');
    }

    return name;
}

export function mangleNameFromDeclaration(
    declaration: ts.SignatureDeclaration,
    ctx: Context,
    mangler: ManglerInterface
) {
    if (declaration.kind === ts.SyntaxKind.MethodDeclaration || declaration.kind === ts.SyntaxKind.MethodSignature) {
        const left = ctx.typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;

        return mangler.getMethodName(
            extractNameFromObjectType(left),
            <string>(<ts.Identifier>declaration.name).escapedText,
            declaration.parameters
        );
    }

    if (declaration.kind === ts.SyntaxKind.ConstructSignature) {
        const left = ctx.typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;

        return mangler.getMethodName(
            extractNameFromObjectType(left),
            <string>(<any>declaration.name),
            declaration.parameters
        );
    }

    if (declaration.kind === ts.SyntaxKind.Constructor) {
        const left = ctx.typeChecker.getTypeAtLocation(declaration.parent!) as ts.ObjectType;

        return mangler.getMethodName(
            extractNameFromObjectType(left),
            <string>(<any>declaration.name),
            declaration.parameters
        );

    }


    return mangler.getFunctionName(
        <string>(<ts.Identifier>declaration.name).escapedText,
        declaration.parameters
    );
}


export function buildCalleFromSignature(
    signature: ts.Signature,
    ctx: Context,
    builder: llvm.IRBuilder,
    fnName?: string
): llvm.Function|null {
    if (ctx.signature.has(signature)) {
        if (!fnName) {
            return ctx.signature.get(signature);
        } else {
            if (ctx.apiFunction.has(fnName)) {
                return ctx.apiFunction.get(fnName);
            }
        }
    }

    const declaration = <ts.SignatureDeclaration>signature.declaration;
    if (declaration.name) {
        const sourceFile = declaration.getSourceFile();

        if (sourceFile.fileName === RUNTIME_DEFINITION_FILE) {
	    var llvmFunction;
	    if (fnName) {
               llvmFunction = declareFunctionFromDefinition(
                    <ts.FunctionDeclaration>declaration,
                    ctx,
                    builder,
                    fnName
               );

               ctx.signature.set(signature, llvmFunction);
               ctx.apiFunction.set(fnName, llvmFunction);
               return llvmFunction;
	    } else {
	       llvmFunction = declareFunctionFromDefinition(
                    <ts.FunctionDeclaration>declaration,
                    ctx,
                    builder,
                    mangleNameFromDeclaration(declaration, ctx, CPPMangler)
               );

               ctx.signature.set(signature, llvmFunction);

               return llvmFunction;
	   }
        }

        if (sourceFile.fileName === LANGUAGE_DEFINITION_FILE) {
            var llvmFunction;
            if (fnName) {
               llvmFunction = declareFunctionFromDefinition(
                    <ts.FunctionDeclaration>declaration,
                    ctx,
                    builder,
                    fnName
               );

               ctx.signature.set(signature, llvmFunction);
               ctx.apiFunction.set(fnName, llvmFunction);
               return llvmFunction;
            } else {
               llvmFunction = declareFunctionFromDefinition(
                    <ts.FunctionDeclaration>declaration,
                    ctx,
                    builder,
                    mangleNameFromDeclaration(declaration, ctx, CMangler)
               );

               ctx.signature.set(signature, llvmFunction);

               return llvmFunction;
           }

        }
    }

    return null;
}


export function buildCalleFromCallExpression(
    expr: ts.CallExpression,
    ctx: Context,
    builder: llvm.IRBuilder,
    fnName?: string
) {
    const signature = ctx.typeChecker.getResolvedSignature(expr);
    console.log(`Function signature: ${ctx.typeChecker.signatureToString(signature)}`);
    if (signature) {
        const callSignature = buildCalleFromSignature(signature, ctx, builder, fnName);
        if (callSignature) {
            return callSignature;
        }
    }
    
    console.log(`The expression in CallExpression: ${ts.SyntaxKind[expr.expression.kind]}`);
    return buildFromExpression(expr.expression, ctx, builder).getValue();
}

function declareFunctionFromDefinition(
    stmt: ts.FunctionDeclaration,
    ctx: Context,
    builder: llvm.IRBuilder,
    name: string
): llvm.Function {
    let returnType = llvm.Type.getVoidTy(ctx.llvmContext);

    if (stmt.type) {
        const nativeReturnType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(stmt.type), ctx);
        if (nativeReturnType) {
            returnType = nativeReturnType.getType();
        } else {
            throw new UnsupportedError(
                stmt,
                `Unsupported return type`
            );
        }
    }

    let fnType = llvm.FunctionType.get(
        returnType,
        stmt.parameters.map((parameter) => {
            if (parameter.type) {
                let t: ts.ParameterDeclaration = parameter;
                const nativeType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parameter.type), ctx);
                if (nativeType) {
                    return nativeType.getType();
                }
            }

            console.log(parameter.type.getFullText());
            throw new UnsupportedError(
                stmt,
                `Unsupported parameter`
            );
        }),
        false
    );

    return llvm.Function.create(
        fnType,
        llvm.LinkageTypes.ExternalLinkage,
        name,
        ctx.llvmModule
    );
}

export function buildFromIdentifier(identifier: ts.Identifier, ctx: Context, builder: llvm.IRBuilder): Value {
    //console.trace(); 
    const variable = ctx.scope.variables.get(<string>identifier.escapedText);
    if (variable) {
        return variable;
    }

    const clazz = ctx.scope.classes.get(<string>identifier.escapedText);
    if (clazz) {
        return new ClassReference(clazz);
    }

    const fn = ctx.llvmModule.getFunction(<string>identifier.escapedText);
    if (fn) {
	console.log(`The function reference: ${<string>identifier.escapedText}`);
        return new FunctionReference(fn);
    }

    throw new UnsupportedError(
        identifier,
        `Unknown Identifier: "${<string>identifier.escapedText}"`
    );
}

function buildFromObjectLiteralExpression(block: ts.ObjectLiteralExpression, ctx: Context, 
					  builder: llvm.IRBuilder, nativeType?: NativeType) {
	// Creating a map (string -> string) from an object literal expression
	for (let prop of block.properties) {
		switch (prop.kind) {
                    case ts.SyntaxKind.PropertyAssignment:
                        // Supporting string to string maps
                        // TODO: More map types
                        const v : ts.PropertyAssignment = prop as ts.PropertyAssignment;
                        console.log(`The type of properties: ${ts.SyntaxKind[v.kind]}, 
                                name expr text: ${(<ts.StringLiteral>v.name).text},
                                assgn expr text: ${(<ts.StringLiteral>v.initializer).text}`);
                        const key = (<ts.StringLiteral>v.name).text;
                        const value = (<ts.StringLiteral>v.initializer).text;
                	                                

                        break;  
                    default:
                        throw new UnsupportedError(
                                block,
                                `Unsupported property: "${ts.SyntaxKind[prop.kind]}"`);
                }
        }
}

export function buildFromExpression(block: ts.Expression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
    console.log("Syntax type of block " + ts.SyntaxKind[block.kind])
    switch (block.kind) {
        case ts.SyntaxKind.NewExpression:
            return new NewExpressionGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.PropertyAccessExpression:
	        console.log("Generating code for PropertyAccessExpression");	
            return new PropertyAccessExpressionCodeGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.Identifier:
            return buildFromIdentifier(<any>block, ctx, builder);
        case ts.SyntaxKind.NumericLiteral:
            return buildFromNumericLiteral(<any>block, ctx, builder, nativeType);
        case ts.SyntaxKind.ArrayLiteralExpression:
            return new ArrayLiteralExpressionCodeGenerator().generate(block as ArrayLiteralExpression, ctx, builder, nativeType);
        case ts.SyntaxKind.StringLiteral:
            return buildFromStringValue(<any>block, ctx, builder);
        case ts.SyntaxKind.TrueKeyword:
            return buildFromTrueKeyword(<any>block, ctx, builder);
        case ts.SyntaxKind.FalseKeyword:
            return buildFromFalseKeyword(<any>block, ctx, builder);
        case ts.SyntaxKind.BinaryExpression:
            return new BinaryExpressionCodeGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.PrefixUnaryExpression:
            return new PrefixUnaryExpressionCodeGenerator().generate(block as ts.PrefixUnaryExpression, ctx, builder);
        case ts.SyntaxKind.PostfixUnaryExpression:
            return new PostfixUnaryExpressionCodeGenerator().generate(block as ts.PostfixUnaryExpression, ctx, builder);
        case ts.SyntaxKind.CallExpression:
            return new CallExpressionCodeGenerator().generate(<any>block, ctx, builder);
        case ts.SyntaxKind.ExpressionStatement:
            return <any>buildFromExpression((<any>block).expression, ctx, builder);
        case ts.SyntaxKind.TypeOfExpression:
            return new TypeOfExpressionCodeGenerator().generate(block as ts.TypeOfExpression, ctx, builder);
        case ts.SyntaxKind.ParenthesizedExpression:
            return buildFromExpression((<ts.ParenthesizedExpression>block).expression, ctx, builder);
	    case ts.SyntaxKind.ObjectLiteralExpression:
	        // Create a map and store it in a variable here
	        buildFromObjectLiteralExpression(<ts.ObjectLiteralExpression>block, ctx, builder);
	        return null
	    case ts.SyntaxKind.ElementAccessExpression:
	        return new ElementAccessExpressionGenerator().generate(block as ts.ElementAccessExpression, ctx, builder);
        case ts.SyntaxKind.RegularExpressionLiteral:
            return buildFromRegularExpressionValue(<any>block, ctx, builder);
        case ts.SyntaxKind.NullKeyword:
            return buildFromNullExpr(<any>block, ctx, builder);
        case ts.SyntaxKind.TemplateExpression:
            //FIXME: Implement Template Expression
            return new TemplateExpressionCodeGenerator().generate(block as ts.TemplateExpression, ctx, builder);
        case ts.SyntaxKind.ConditionalExpression:
            return new ConditionalExpressionCodeGenerator().generate(block as ts.ConditionalExpression, ctx, builder);
        case ts.SyntaxKind.FirstTemplateToken:
            return buildFromString((<ts.NoSubstitutionTemplateLiteral>block).text, ctx, builder)
        default:
	    //console.trace();
        
	    console.log(`The node type: ${ts.SyntaxKind[block.kind]}`);
        //console.log(block)
        console.log((<any>block).templateSpans[0])
            //const v = (<ts.ObjectLiteralExpression<ts.ObjectLiteralElementLike>>block).properties[5].name;
	    //const v : ts.PropertyAssignment = (<ts.ObjectLiteralExpression>block).properties[5] as ts.PropertyAssignment;
            //console.log(`The type of properties: ${ts.SyntaxKind[v.kind]}, 
		//	name expr text: ${(<ts.StringLiteral>v.name).text},
		//	assgn expr text: ${(<ts.StringLiteral>v.initializer).text}`);
	    
            throw new UnsupportedError(
                block,
                `Unsupported Expression.type: "${block.kind}"`
            );
    }
}

function generateAssignment(block: ts.VariableDeclaration, rhs: Value, ctx: Context, builder: llvm.IRBuilder) : llvm.Value {
	var value: llvm.Value;
	switch (rhs.getType()) {
		case ValueTypeEnum.STRING:
			const pointerTy = rhs.getValue().type;
			if (pointerTy.toString() === "i8*") {
				// Allocate first time
				console.log("Allocating string for the first time");
				value = builder.createAlloca(
                			pointerTy,
                			undefined,
                			<string>(<ts.Identifier>(block.name)).escapedText
            			);

            			builder.createStore(
                			rhs.getValue(),
                			value,
                			false
            			);

				return value;
			} else {
				// Propagate new variables
				const rhsVar = builder.createLoad(rhs.getValue());
				value = builder.createAlloca(
                                        llvm.Type.getInt8PtrTy(ctx.llvmContext),
                                        undefined,
                                        <string>(<ts.Identifier>(block.name)).escapedText
                                );

				builder.createStore(
                                        rhsVar,
                                        value,
                                        false
                                );
                                return value;
			}

			break;
        case ValueTypeEnum.OBJECT:
        case ValueTypeEnum.BOOLEAN:
        case ValueTypeEnum.DOUBLE:
            const loaded_val = loadIfNeeded(rhs, builder);
			value = builder.createAlloca(
                                        loaded_val.type,
                                        undefined,
                                        <string>(<ts.Identifier>(block.name)).escapedText
                        );

                        builder.createStore(
                                        loaded_val,
                                        value,
                                        false
                        );

                        return value;
			break;

		default:
            
			// regular load and store
            console.log("Default case in load instruction");
			const rhsVar = loadIfNeeded(rhs, builder);
			value = builder.createAlloca(
                                        rhsVar.type,
                                        undefined,
                                        <string>(<ts.Identifier>(block.name)).escapedText
                        );

			builder.createStore(
                                        rhsVar,
                                        value,
                                        false
                        );
                        return value;
			break;			
	}

	return null
}	

export function passVariableDeclaration(block: ts.VariableDeclaration, ctx: Context, builder: llvm.IRBuilder) {
    if (block.initializer && block.name.kind == ts.SyntaxKind.Identifier) {
	    const typ = ctx.typeChecker.getTypeFromTypeNode(block.type);
	    console.log(`var name: ${<string>block.name.escapedText}, type: ${ts.TypeFlags[typ.flags]}, isString: ${typ.isStringLiteral()}, insname: ${(<any>typ).intrinsicName}`);
        const nativeTypeForDefaultValue = NativeTypeResolver.getType(
            ctx.typeChecker.getTypeFromTypeNode(block.type),
            ctx
        );

        const defaultValue = buildFromExpression(block.initializer, ctx, builder, nativeTypeForDefaultValue);
        if (defaultValue instanceof Primitive) {
	        console.log(`Type of alloca var Primitive: ${defaultValue.getValue().type.toString()}`);
            /*const value = builder.createAlloca(
                defaultValue.getValue().type,
                undefined,
                <string>block.name.escapedText
            );

            builder.createStore(
                defaultValue.getValue(),
                value,
                false
            );*/
	    
            const value = generateAssignment(block, defaultValue, ctx, builder);
            console.log("Generated Assignment")
            ctx.scope.variables.set(<string>block.name.escapedText, new Primitive(value, defaultValue.getType()));
        } else if (defaultValue instanceof ObjectReference) {
            console.log(`Type of alloca var: ${defaultValue.getValue().type.toString()}`);
            const value = generateAssignment(block, defaultValue, ctx, builder);
            console.log("Generated Assignment");
            let class_ref = (<ObjectReference>defaultValue).classReference;
            let call_inst = (<ObjectReference>defaultValue).llvmValue;

            ctx.scope.variables.set(<string>block.name.escapedText, new ObjectReference(class_ref, call_inst));
        } else {
            // Handling the case where the array var is of type ArrayReference
            console.log(`Type of Array/ObjectVar var: ${defaultValue.getValue().type.toString()}`);
            ctx.scope.variables.set(<string>block.name.escapedText, defaultValue);
        }

        return;
    }

    throw new UnsupportedError(
        block,
        'Unsupported variable declaration block'
    );
}

export function passVariableDeclarationList(block: ts.VariableDeclarationList, ctx: Context, builder: llvm.IRBuilder) {
    for (const variableDeclaration of block.declarations) {
        passVariableDeclaration(variableDeclaration, ctx, builder);
    }
}

export function passVariableStatement(block: ts.VariableStatement, ctx: Context, builder: llvm.IRBuilder) {
    for (const declaration of block.declarationList.declarations) {
        passStatement(<any>declaration, ctx, builder);
    }
}

export function passStatement(stmt: ts.Statement, ctx: Context, builder: llvm.IRBuilder) {
    switch (stmt.kind) {
        case ts.SyntaxKind.Block:
            passBlockStatement(stmt as ts.Block, ctx, builder);
            break;
        case ts.SyntaxKind.VariableDeclaration:
            passVariableDeclaration(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.VariableDeclarationList:
            passVariableDeclarationList(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.VariableStatement:
            passVariableStatement(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.ExpressionStatement:
            buildFromExpression(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.FunctionDeclaration:
            new FunctionDeclarationCodeGenerator().generate(stmt as ts.FunctionDeclaration, ctx, builder);
            break;
        case ts.SyntaxKind.ReturnStatement:
            new ReturnStatementCodeGenerator().generate(stmt as ts.ReturnStatement, ctx, builder);
            break;
        case ts.SyntaxKind.ClassDeclaration:
            new ClassDeclarationGenerator().generate(stmt as ts.ClassDeclaration, ctx, builder);
            break;
        case ts.SyntaxKind.BreakStatement:
            new BreakStatementGenerator().generate(stmt as ts.BreakStatement, ctx, builder);
            break;
        case ts.SyntaxKind.ContinueStatement:
            new ContinueStatementGenerator().generate(stmt as ts.ContinueStatement, ctx, builder);
            break;
        case ts.SyntaxKind.IfStatement:
            new IfStatementCodeGenerator().generate(stmt as ts.IfStatement, ctx, builder);
            break;
        case ts.SyntaxKind.ForStatement:
            new ForStatementGenerator().generate(stmt as ts.ForStatement, ctx, builder);
            break;
        case ts.SyntaxKind.DoStatement:
            new DoStatementGenerator().generate(stmt as ts.DoStatement, ctx, builder);
            break;
        case ts.SyntaxKind.TryStatement:
            new TryStatementGenerator().generate(stmt as ts.TryStatement, ctx, builder);
            break;
        case ts.SyntaxKind.WhileStatement:
            new WhileStatementGenerator().generate(stmt as ts.WhileStatement, ctx, builder);
            break;
        case ts.SyntaxKind.BinaryExpression:
            new BinaryExpressionCodeGenerator().generate(<any>stmt, ctx, builder);
            break;
        case ts.SyntaxKind.PostfixUnaryExpression:
            new PostfixUnaryExpressionCodeGenerator().generate(<any>stmt, ctx, builder);
            break;
	case ts.SyntaxKind.EndOfFileToken:
	    break;
        default:
            throw new UnsupportedError(
                stmt,
                `Unsupported statement: "${stmt.kind}"`
            );
    }
}

export function loadIfNeeded(value: Value, builder: llvm.IRBuilder): llvm.Value {
    // Hacky Styff: global string is of type i8, other string pointer values are i8**
    if (value.getValue().type.isPointerTy() && !(value.getValue().type.toString() === "i8*")) {
        console.log(`[DEBUG] Value Type: ${value.getValue().type.toString()}`)
        let val_typ = value.getValue().type as llvm.PointerType;
        if (!val_typ.elementType.isArrayTy() && !val_typ.elementType.isStructTy()) {
            return builder.createLoad(value.getValue());
        }
    }
    
    
    return value.getValue();
}

function passBlockStatement(node: ts.Block, ctx: Context, builder: llvm.IRBuilder) {
    for (const stmt of node.statements) {
        passStatement(stmt, ctx, builder);
    }
}

export function passNode(node: ts.Node, ctx: Context, builder: llvm.IRBuilder) {
    switch (node.kind) {
        case ts.SyntaxKind.Block:
            passBlockStatement(<any>node, ctx, builder);
            break;
	case ts.SyntaxKind.IfStatement:
	    passStatement(<any>node, ctx, builder);
            break;
	default:
	    console.log(`[Unparsed] Type of Statement: ${ts.SyntaxKind[node.kind]}`);		
	    passStatement(<any>node, ctx, builder);
    }
}

export function initializeLLVM() {
    llvm.initializeAllTargetInfos();
    llvm.initializeAllTargets();
    llvm.initializeAllTargetMCs();
    llvm.initializeAllAsmParsers();
    llvm.initializeAllAsmPrinters();
}

function addEntryShimCalls(ctx: Context, builder: llvm.IRBuilder) {
    
}

export function generateModuleFromProgram(program: ts.Program, mainfnName: string): llvm.Module {
    const ctx = new Context(
        program.getTypeChecker()
    );

    const mainFnType = llvm.FunctionType.get(llvm.Type.getInt64Ty(ctx.llvmContext), false);
    const mainFn = llvm.Function.create(mainFnType, llvm.LinkageTypes.ExternalLinkage, mainfnName, ctx.llvmModule);

    const block = llvm.BasicBlock.create(ctx.llvmContext, "entry", mainFn);
    const builder = new llvm.IRBuilder(block);

    ctx.scope.enclosureFunction = {
        llvmFunction: mainFn,
        declaration: null
    };

    addEntryShimCalls(ctx, builder);

    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            sourceFile.forEachChild((node: ts.Node) => passNode(node, ctx, builder))
        }
    }

    builder.createRet(
        llvm.ConstantInt.get(ctx.llvmContext, 0, 64)
    );

    return ctx.llvmModule;
}
