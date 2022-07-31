
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {Primitive, Value, convertLLVMTypeToValueType} from "../value";
import UnsupportedError from "../../error";
import {IsRuleIngredient} from "./rule-ingredient"
import {buildFromExpression} from "../index";

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

export class PropertyAccessExpressionCodeGenerator implements NodeGenerateInterface<ts.PropertyAccessExpression, Value> {
    generate(node: ts.PropertyAccessExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
	// Check if the property is an ingredient:
	let fullFnName = getFullnameFromProperty(node);
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
