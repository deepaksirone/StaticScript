import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Primitive, ValueTypeEnum, ArrayReference} from "../value";
import {NativeType} from "../native-type";
import {buildFromExpression, loadIfNeeded} from "../index"
import UnsupportedError from "../../error";


export class ElementAccessExpressionGenerator implements NodeGenerateInterface<ts.ElementAccessExpression, Primitive> {
    generate(node: ts.ElementAccessExpression, ctx: Context, builder: llvm.IRBuilder, nativeType?: NativeType): Primitive {
	const array = buildFromExpression(node.expression, ctx, builder) as ArrayReference;
	const arrIdx1 = buildFromExpression(node.argumentExpression, ctx, builder);
	//const cast = builder.createBitCast(arrIdx1.getValue(), llvm.Type.getInt32PtrTy(ctx.llvmContext));
	console.log("[DEBUG] here1");
	console.log(array);
	const siArrIdx1 = builder.createFPToSI(loadIfNeeded(arrIdx1, builder), llvm.Type.getInt32Ty(ctx.llvmContext));
	//const siArrIdx1 = loadIfNeeded(new Primitive(cast), builder);
	const arrIdx2 = llvm.ConstantInt.get(ctx.llvmContext, 0, 32);
	const idxArray : Array<llvm.Value> = [arrIdx2, siArrIdx1];
	console.log("[DEBUG] here2")
	
	const elemPtr = builder.createInBoundsGEP(array.getValue(), idxArray);
	//const elemPtr = builder.createExtractValue(array.getValue(), []);
	console.log("[DEBUG] here3")
	const elem = builder.createLoad(elemPtr);
	console.log("[DEBUG] here4");
	if (array.elementType.isPointerTy()) {
		return new Primitive(elem, ValueTypeEnum.STRING);
	} else {
		return new Primitive(elem)
	}

    }
}
