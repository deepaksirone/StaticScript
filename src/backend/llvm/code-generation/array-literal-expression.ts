
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {ArrayReference} from "../value";
import {NativeType} from "../native-type";
import {buildFromExpression} from "../index"
import UnsupportedError from "../../error";

export class ArrayLiteralExpressionCodeGenerator implements NodeGenerateInterface<ts.ArrayLiteralExpression, ArrayReference> {
    generate(node: ts.ArrayLiteralExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): ArrayReference {
        if (!nativeType) {
            throw new UnsupportedError(
                node,
                'NativeTypeResolver didnt resolve type of this array'
            );
        }


        /*const structType = ArrayLiteralExpressionCodeGenerator.buildTypedArrayStructLLVMType(
            nativeType.getType(),
            ctx,
            `array<${nativeType.getType().toString()}>`
        );*/

        const arrayType = ArrayLiteralExpressionCodeGenerator.buildTypedArrayLLVMType(nativeType.getType(), node.elements.length, ctx, `array<${nativeType.getType().toString()}>`);

	console.log(`Array native type: ${arrayType.toString()}`);

        const allocate = builder.createAlloca(
            arrayType
        );

	// Store each element into the array
        ArrayLiteralExpressionCodeGenerator.storeIntoArray(node, ctx, builder, allocate);	

        return new ArrayReference(
            nativeType.getType(),
            allocate,
	    node.elements.length
        );
    }

    static buildTypedArrayStructLLVMType(elementType: llvm.Type, ctx: Context, name: string): llvm.StructType {
        const structType = llvm.StructType.create(ctx.llvmContext, name);

        structType.setBody([
            elementType,
            // size
            llvm.Type.getInt32Ty(ctx.llvmContext),
            // capacity
            llvm.Type.getInt32Ty(ctx.llvmContext),
        ]);

        return structType;
    }

    static buildTypedArrayLLVMType(elementType: llvm.Type, numElements: number, ctx: Context, name: string): llvm.ArrayType {
	const type = llvm.ArrayType.get(elementType, numElements);
	return type;
    }

    static storeIntoArray(node: ts.ArrayLiteralExpression, ctx: Context, builder: llvm.IRBuilder, array: llvm.AllocaInst) {
	for (var i = 0; i < node.elements.length; i++) {
		const val = buildFromExpression(node.elements[i], ctx, builder);
		const arrIdx1 = llvm.ConstantInt.get(ctx.llvmContext, i, 64);
		const arrIdx2 = llvm.ConstantInt.get(ctx.llvmContext, 0, 64);
		const idxArray : Array<llvm.Value> = [arrIdx2, arrIdx1];
		const arrayPtr = builder.createInBoundsGEP(array, idxArray);
		builder.createStore(val.getValue(), arrayPtr);
	}
    }
	
}
