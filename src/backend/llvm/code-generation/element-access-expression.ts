import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Primitive, ValueTypeEnum, ArrayReference} from "../value";
import {NativeType} from "../native-type";
import {buildFromExpression} from "../index"
import UnsupportedError from "../../error";


export class ElementAccessExpressionGenerator implements NodeGenerateInterface<ts.ElementAccessExpression, Primitive> {
    generate(node: ts.ElementAccessExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Primitive {
	const array = buildFromExpression(node.expression, ctx, builder) as ArrayReference;
	const arrIdx1 = buildFromExpression(node.argumentExpression, ctx, builder).getValue();

	const siArrIdx1 = builder.createFPToSI(arrIdx1, llvm.Type.getInt64Ty(ctx.llvmContext));
	const arrIdx2 = llvm.ConstantInt.get(ctx.llvmContext, 0, 64);
	const idxArray : Array<llvm.Value> = [siArrIdx1, arrIdx2];

	const elemPtr = builder.createInBoundsGEP(array.getValue(), idxArray);
	const elem = builder.createLoad(elemPtr);

	if (array.elementType.isPointerTy()) {
		return new Primitive(elem, ValueTypeEnum.STRING);
	} else {
		return new Primitive(elem)
	}

    }
}
