
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {Primitive, Value, convertLLVMTypeToValueType} from "../value";
import UnsupportedError from "../../error";
import {buildFromExpression} from "../index";

export class PropertyAccessExpressionCodeGenerator implements NodeGenerateInterface<ts.PropertyAccessExpression, Value> {
    generate(node: ts.PropertyAccessExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Value {
	// Check if the property is an ingredient:
	if (<string>node.name.escapedText === 'ConditionImageURL') {
		console.log("Fixing up ingredient ConditionImageURL");
		//TODO: Generate code for function call to ConditionImageURL
		let returnTy = llvm.Type.getInt8PtrTy(
                    ctx.llvmContext
                );

		let fnType = llvm.FunctionType.get(
        		returnTy,
			[],
			false);
		let fn = llvm.Function.create(
        		fnType,
        		llvm.LinkageTypes.ExternalLinkage,
        		'ConditionImageURL',
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
