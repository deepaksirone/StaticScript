
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {Primitive, Value, ValueTypeEnum} from "../value";
import UnsupportedError from "../../error";
import {buildFromExpression, loadIfNeeded} from "../index";
import { LANGUAGE_DEFINITION_FILE } from "../../../constants";

export class PrefixUnaryExpressionCodeGenerator implements NodeGenerateInterface<ts.PrefixUnaryExpression, Value> {
    generate(node: ts.PrefixUnaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operator) {
            case ts.SyntaxKind.PlusPlusToken: {
                const left = buildFromExpression(node.operand, ctx, builder);

                const next = builder.createFAdd(
                    loadIfNeeded(left, builder),
                    llvm.ConstantFP.get(ctx.llvmContext, 1)
                );

                builder.createStore(
                    next,
                    left.getValue(),
                    false
                );

                return left;
            }
            case ts.SyntaxKind.MinusMinusToken: {
                const left = buildFromExpression(node.operand, ctx, builder);

                const next = builder.createFSub(
                    loadIfNeeded(left, builder),
                    llvm.ConstantFP.get(ctx.llvmContext, 1)
                );

                builder.createStore(
                    next,
                    left.getValue(),
                    false
                );

                return left;
            }
            case ts.SyntaxKind.MinusToken: {
                const left = buildFromExpression(node.operand, ctx, builder);
                const minus_1 = llvm.ConstantFP.get(ctx.llvmContext, -1);
                return new Primitive(builder.createFMul(left.getValue(), minus_1));
            }
            case ts.SyntaxKind.PlusToken : { 
                const left = buildFromExpression(node.operand, ctx, builder);
                return new Primitive(left.getValue());
            }
            case ts.SyntaxKind.ExclamationToken : {
                const left = buildFromExpression(node.operand, ctx, builder);
                console.log("[Exclamation Token Type] " + left.getType())
                switch (left.getType()) {
                    case ValueTypeEnum.BOOLEAN: {
                        return new Primitive(
                            builder.createICmpEQ(
                                loadIfNeeded(left, builder),
                                llvm.ConstantInt.get(
                                    ctx.llvmContext,
                                    0,
                                    1,
                                    false
                                )
                            ), ValueTypeEnum.BOOLEAN
                        );
                    }
                    case ValueTypeEnum.STRING:
                    case ValueTypeEnum.ARRAY: {
                        let l = builder.createPtrToInt(left.getValue(), llvm.Type.getInt64Ty(ctx.llvmContext));
                        let r = builder.createPtrToInt(llvm.ConstantPointerNull.get(llvm.Type.getInt8PtrTy(ctx.llvmContext)), llvm.Type.getInt64Ty(ctx.llvmContext));
                        return new Primitive(
                            builder.createICmpNE(l, r), ValueTypeEnum.BOOLEAN
                        );
                    }
                }
            }
            default:
                throw new UnsupportedError(
                    node,
                    `Unsupported PrefixUnaryExpression.operator: "${node.operator}"`
                );
        }
    }
}
