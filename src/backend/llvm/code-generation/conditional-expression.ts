
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {ArrayReference, Primitive, Value, ValueTypeEnum} from "../value";
import UnsupportedError from "../../error/unsupported.error";
import {buildFromExpression, loadIfNeeded} from "../index";

export class ConditionalExpressionCodeGenerator implements NodeGenerateInterface<ts.ConditionalExpression, Value> {
    generate(node: ts.ConditionalExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        const false_expr = buildFromExpression(node.whenFalse, ctx, builder);
        const true_expr = buildFromExpression(node.whenTrue, ctx, builder);

        if (true_expr.getType() != false_expr.getType()) {
            throw new UnsupportedError(node, "True and False branches of the ternary operator should be the same type")
        }

        const cmp_expr = buildFromExpression(node.condition, ctx, builder);
        const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "cond_phi.true");
        const negativeBlock = llvm.BasicBlock.create(ctx.llvmContext, "cond_phi.false");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(negativeBlock);

        const bb = builder.getInsertBlock();

        builder.createCondBr(cmp_expr.getValue(), positiveBlock, negativeBlock);

        builder.setInsertionPoint(negativeBlock);
        builder.createBr(positiveBlock);

        builder.setInsertionPoint(positiveBlock);
        let phi = builder.createPhi(false_expr.getValue().type, 2, "cond_phi.phi");
        phi.addIncoming(true_expr.getValue(), bb);
        phi.addIncoming(false_expr.getValue(), negativeBlock);

        return new Primitive(
            phi
        )

    }

}