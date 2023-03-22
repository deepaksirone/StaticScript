
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Primitive, Value, ValueTypeEnum, convertLLVMTypeToValueType} from "../value";
import {NativeType} from "../native-type";
import UnsupportedError from "../../error";
import {buildCalleFromCallExpression, buildFromExpression, loadIfNeeded} from "../index";
import {isAPIFunction, generateAPIFunctionCall} from "./api/ap-fns"

export function getFullnameFromCallExpression(node: ts.Expression): string {
        switch (node.kind) {
                case ts.SyntaxKind.PropertyAccessExpression:
                        return getFullnameFromCallExpression((<ts.PropertyAccessExpression>node).expression) + '_' + <string>(<ts.PropertyAccessExpression>node).name.escapedText;
                case ts.SyntaxKind.Identifier:
                        return <string>((<ts.Identifier>node).escapedText);
		        case ts.SyntaxKind.CallExpression:
			            return getFullnameFromCallExpression((<ts.CallExpression>node).expression);		
                default:
                        console.log(`[getFullnameFromProperty] Returning empty string for type: ${ts.SyntaxKind[node.kind]}`);
                        return ""
        }

        return '';
}

export class CallExpressionCodeGenerator implements NodeGenerateInterface<ts.CallExpression, Value> {
    generate(node: ts.CallExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
	//console.trace();
	//Hacky way to handle Action API and skip functions
	const signature = ctx.typeChecker.getResolvedSignature(node);
    
	var callle = null;
	if (signature) {
		switch ((<ts.SignatureDeclaration>signature.declaration).kind) {
            case ts.SyntaxKind.MethodSignature:
			case ts.SyntaxKind.MethodDeclaration: {

                let method_name = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration)).name.getText();
                console.log(`Generating Code for Method: ${method_name}`);
                let parent = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration)).parent;
                let parent_class = (<ts.ClassDeclaration>parent).name.escapedText.toString();
                console.log(`Parent Class Name: ${parent_class}`);
                let fn_name = parent_class + "_" + method_name;
                console.log(`Function Name: ${fn_name}`);

                if (isAPIFunction(parent_class, method_name)) {
                    let api_struct = buildFromExpression(node.expression, ctx, builder);
                    let call_expr = generateAPIFunctionCall(parent_class, method_name, api_struct, node, ctx, builder);
                    console.log("Generated call expression for method call");
                    return new Primitive(call_expr);
                }

				let fullName = getFullnameFromCallExpression(node);
				console.log(`The full name: ${fullName}`);
				callle = buildCalleFromCallExpression(node, ctx, builder, fullName);
                break;
			}
			
			default: {
				console.log(`The type of SignatureDeclaration: ${ts.SyntaxKind[(<ts.SignatureDeclaration>signature.declaration).kind]}`);
				callle = buildCalleFromCallExpression(node, ctx, builder);
                break;
			}
		}
	} else {
		callle = buildCalleFromCallExpression(node, ctx, builder);
	}

        if (!callle) {
            throw new UnsupportedError(
                node,
                `We cannot prepare expression to call this function, ${node.expression}`
            );
        }

        const args = node.arguments.map((expr) => {
            return loadIfNeeded(
                buildFromExpression(<any>expr, ctx, builder), builder
            );
        });

	const fntype = (callle.type as llvm.PointerType).elementType;
	const valEnum = convertLLVMTypeToValueType(fntype);

	//TODO: Return the correct primitive type for the function return value
        return new Primitive(
            builder.createCall(
                callle,
                args,
            ), valEnum
        );
    }
}
