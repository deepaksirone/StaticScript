
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {Primitive, ArrayReference, Value, ValueTypeEnum, convertLLVMTypeToValueType} from "../value";
import UnsupportedError from "../../error";
import {IsRuleIngredient} from "./rule-ingredient"
import {buildFromExpression, loadIfNeeded} from "../index";
import {LANGUAGE_DEFINITION_FILE} from "../../../constants"
import {generate_runtime_struct_type} from "./api/generate-llvm-type"
import {NativeTypeResolver} from "../native-type-resolver"

function getFullnameFromProperty(node: ts.Expression, ctx: Context): [string, string] {
	switch (node.kind) {
		case ts.SyntaxKind.PropertyAccessExpression: {
			let ret = getFullnameFromProperty((<ts.PropertyAccessExpression>node).expression, ctx);
			return [ret[0] + '_' + <string>(<ts.PropertyAccessExpression>node).name.escapedText, ret[1]];
		}
		case ts.SyntaxKind.Identifier: {
			let typ = ctx.typeChecker.getTypeAtLocation(node);
			
			//console.log("The source file : " + typ.symbol.getDeclarations()[0].getSourceFile().fileName);
			if (typ.symbol) {
				return [<string>((<ts.Identifier>node).escapedText), typ.symbol.getDeclarations()[0].getSourceFile().fileName];
			} else {
				return [<string>((<ts.Identifier>node).escapedText), undefined];
			}
		}
		default:
			console.log(`[getFullnameFromProperty] Returning empty string for type: ${ts.SyntaxKind[node.kind]}`);
			return ["", ""]
	}

	return ['', ""];
}

function isJSProperty(node: ts.PropertyAccessExpression): boolean {
	switch (<string>(<ts.PropertyAccessExpression>node).name.escapedText) {
		case "length":
			return true;
		default:
			return false;
	}
}


export class PropertyAccessExpressionCodeGenerator implements NodeGenerateInterface<ts.PropertyAccessExpression, Value> {
    generate(node: ts.PropertyAccessExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
	// Check if the property is an ingredient:
	let fullFnName = getFullnameFromProperty(node, ctx);
	let typ = ctx.typeChecker.getTypeAtLocation(node);
	let typ_parent = ctx.typeChecker.getTypeAtLocation(node.expression)
	console.log("The type of property: " + ((<any>typ).intrinsicName || typ.symbol.getEscapedName()));
	//console.log(typ.symbol.getEscapedName())

	//console.log("The type of parent property: " + (<any>typ_parent).intrinsicName)
	
	//console.log(typ.symbol.getDeclarations())
	
	console.log(`[PropertyAccessExpressionCodeGenerator] The full name: ${fullFnName[0]}`)
	console.log(`[PropertyAccessExpressionCodeGenerator] The defs file: ${fullFnName[1]}`)
	let isRuleIngredientTuple = IsRuleIngredient(fullFnName[0], ctx.llvmContext);
	if (fullFnName[1] == LANGUAGE_DEFINITION_FILE && !isJSProperty(node)) {
		console.log(`[PropertyAccessExpressionCodeGenerator] Parent class in lang def file`)
		let typename = ((<any>typ).intrinsicName || typ.symbol.getEscapedName())
		if (ctx.apiFunction.has(fullFnName[0])) {
			let fn = ctx.apiFunction.get(fullFnName[0]);
			let returnTy = NativeTypeResolver.getType(typ, ctx)
			let fnType = llvm.FunctionType.get(
				returnTy.getType(),
				[],
				false
			);
			const valEnum = convertLLVMTypeToValueType(fnType);
			return new Primitive(
					   builder.createCall(
						fn,
						[],
						 ), valEnum 
			   );
		}
		let returnTy = NativeTypeResolver.getType(typ, ctx)//resolveLLVMType(typename, ctx);
		let fnType = llvm.FunctionType.get(
			returnTy.getType(),
		[],
		false);
		let fn = llvm.Function.create(
			fnType,
			llvm.LinkageTypes.ExternalLinkage,
			fullFnName[0],
			ctx.llvmModule);
			ctx.apiFunction.set(fullFnName[0], fn);
	//TODO: Return call with correct ValueTypeEnum for the function type
		const valEnum = convertLLVMTypeToValueType(fnType);
		return new Primitive(
					   builder.createCall(
						fn,
						[],
						 ), valEnum 
		);
	}
	else if (isRuleIngredientTuple[0]) {
		//console.log("Fixing up ingredient ConditionImageURL");
		console.log(`The fullname: ${fullFnName}`);
		//TODO: Generate code for function call to ConditionImageURL
		let returnTy = isRuleIngredientTuple[1];

		let fnType = llvm.FunctionType.get(
        		returnTy,
			[],
			false);
		let fn = llvm.Function.create(
        		fnType,
        		llvm.LinkageTypes.ExternalLinkage,
        		fullFnName[0],
        		ctx.llvmModule);
		//TODO: Return call with correct ValueTypeEnum for the function type
                const valEnum = convertLLVMTypeToValueType(fnType);
		return new Primitive(
                           builder.createCall(
                        	fn,
                        	[],
                      	   ), valEnum 
       			);
	} else if (isJSProperty(node)) {
		let propertyName = <string>(<ts.PropertyAccessExpression>node).name.escapedText;
		switch (propertyName) {
			case "length":
				//const arr_ref: ArrayReference = <ArrayReference>ctx.scope.variables.get(<string>(<ts.Identifier>node.expression).escapedText);
				//const variable = ctx.scope.variables.get(<string>(<ts.Identifier>node.expression).escapedText);
				const variable = buildFromExpression(node.expression, ctx, builder);
				if (variable.isString()) {
					// Generate __str_len call
					if (!ctx.apiFunction.has("__str_len")) {
						let return_type = new NativeType(llvm.Type.getDoubleTy(ctx.llvmContext));
						let params = [llvm.Type.getInt8PtrTy(ctx.llvmContext)];
						let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
						let fn_name = "__str_len"; 
						let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
						let args = [loadIfNeeded(variable, builder)]
						let call_expr = builder.createCall(fn, args);

						//let res = builder.createICmpNE(call_expr, llvm.ConstantInt.get(ctx.llvmContext, 0, 32));
						ctx.apiFunction.set("__str_len", fn);
						return new Primitive(call_expr, ValueTypeEnum.DOUBLE);
					} else {
						let fn = ctx.apiFunction.get("__str_len");
						let args = [loadIfNeeded(variable, builder)]
						let call_expr = builder.createCall(fn, args);

						return new Primitive(call_expr, ValueTypeEnum.DOUBLE);
					}
				} 
				//Array Type
				else {
					//FIXME: generate function call for array length
					let t = <ArrayReference>variable;
					
					if (t.elementType.isPointerTy()) {
						if (!ctx.apiFunction.has("__str_array_len")) {
							let return_type = new NativeType(llvm.Type.getDoubleTy(ctx.llvmContext));
							let params = [llvm.PointerType.get(t.elementType, 0)];
							let val = builder.createBitCast(variable.getValue(), params[0], "array_char**_bitcast")
							let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
							let fn_name = "__str_array_len"; 
							let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
							let args = [val]
							let call_expr = builder.createCall(fn, args);
	
							//let res = builder.createICmpNE(call_expr, llvm.ConstantInt.get(ctx.llvmContext, 0, 32));
							ctx.apiFunction.set("__str_array_len", fn);
							return new Primitive(call_expr, ValueTypeEnum.DOUBLE);
						} else {
							let fn = ctx.apiFunction.get("__str_array_len");
							let params = llvm.PointerType.get(t.elementType, 0);
							let val = builder.createBitCast(variable.getValue(), params, "array_char**_bitcast")
							let args = [val]
							let call_expr = builder.createCall(fn, args);
	
							return new Primitive(call_expr, ValueTypeEnum.DOUBLE);
						}
					}
					return new Primitive(
							llvm.ConstantFP.get(ctx.llvmContext, (<ArrayReference>variable).getNumElements()),
							ValueTypeEnum.DOUBLE
					);
				}
				
			default:

		}
	}

		//const parent_class = getParentClass()
        const object = buildFromExpression(node.expression, ctx, builder);
        if (object) {
            return object;
        }

        throw new UnsupportedError(
            node,
            'Unsupported...'
        );
    }
}
