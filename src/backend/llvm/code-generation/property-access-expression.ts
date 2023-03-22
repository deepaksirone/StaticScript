
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {Primitive, ArrayReference, Value, ValueTypeEnum, convertLLVMTypeToValueType} from "../value";
import UnsupportedError from "../../error";
import {IsRuleIngredient} from "./rule-ingredient"
import {buildFromExpression, loadIfNeeded} from "../index";

function getFullnameFromProperty(node: ts.Expression): string {
	switch (node.kind) {
		case ts.SyntaxKind.PropertyAccessExpression:
			return getFullnameFromProperty((<ts.PropertyAccessExpression>node).expression) + '_' + <string>(<ts.PropertyAccessExpression>node).name.escapedText;
		case ts.SyntaxKind.Identifier:
			return <string>((<ts.Identifier>node).escapedText);
		default:
			console.log(`[getFullnameFromProperty] Returning empty string for type: ${ts.SyntaxKind[node.kind]}`);
			return ""
	}

	return '';
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
	let fullFnName = getFullnameFromProperty(node);
	console.log(`[PropertyAccessExpressionCodeGenerator] The full name: ${fullFnName}`)
	let isRuleIngredientTuple = IsRuleIngredient(fullFnName, ctx.llvmContext);
	if (isRuleIngredientTuple[0]) {
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
        		fullFnName,
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
				const variable = ctx.scope.variables.get(<string>(<ts.Identifier>node.expression).escapedText);
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
					return new Primitive(
						llvm.ConstantFP.get(ctx.llvmContext, (<ArrayReference>variable).getNumElements()),
						ValueTypeEnum.DOUBLE
					);
				}
				
			default:

		}
	}
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
