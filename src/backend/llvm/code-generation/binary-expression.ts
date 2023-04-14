
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {NativeType} from "../native-type";
import {ArrayReference, Primitive, Value, ValueTypeEnum} from "../value";
import UnsupportedError from "../../error/unsupported.error";
import {buildFromExpression, loadIfNeeded} from "../index";

export class BinaryExpressionCodeGenerator implements NodeGenerateInterface<ts.BinaryExpression, Value> {
    generate(node: ts.BinaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.EqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                builder.createStore(
                    right.getValue(),
                    left.getValue(),
                    false
                );

                return left;
            }
            /**
             * This section resolve exression with equals operator
             * Example: a += 1;
             */
            case ts.SyntaxKind.PercentEqualsToken:
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.LessThanLessThanEqualsToken:
            case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
            case ts.SyntaxKind.CaretEqualsToken:
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.MinusEqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = this.doExpression(node, ctx, builder);

                builder.createStore(
                    right.getValue(),
                    left.getValue(),
                    false
                );

                return left;
            }
            default:
                return this.doExpression(node, ctx, builder);
        }
    }

    doExpression(node: ts.BinaryExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        switch (node.operatorToken.kind) {
            case ts.SyntaxKind.PlusEqualsToken:
            case ts.SyntaxKind.PlusToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                if (left.getType() != right.getType()) {
                    console.log("LHS Type: " + left.getType());
                    console.log("RHS Type: " + right.getType());
                    //TODO: Handle Type conversions
                    throw new UnsupportedError (node, "Type conversions unsupported");
                } else {
                    switch (left.getType()) {
                        case ValueTypeEnum.STRING: {
                            // Generate a call to strcat function
                            // Return type for string type here
                            if (!ctx.apiFunction.has("__str_concat")) {
                                let return_type = new NativeType(llvm.Type.getInt8PtrTy(ctx.llvmContext));
                                let params = [llvm.Type.getInt8PtrTy(ctx.llvmContext), llvm.Type.getInt8PtrTy(ctx.llvmContext)];
                                let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
                                let fn_name = "__str_concat"; 
                                let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
                                let args = [loadIfNeeded(left, builder), loadIfNeeded(right, builder)]
                                let call_expr = builder.createCall(fn, args);
                                ctx.apiFunction.set("__str_concat", fn);
                                return new Primitive(call_expr, ValueTypeEnum.STRING);
                            } else {
                                let fn = ctx.apiFunction.get("__str_concat");
                                let args = [loadIfNeeded(left, builder), loadIfNeeded(right, builder)]
                                let call_expr = builder.createCall(fn, args);
                                return new Primitive(call_expr, ValueTypeEnum.STRING);
                            }

                        }
                        default: {
                            return new Primitive(
                                builder.createFAdd(
                                    loadIfNeeded(left, builder),
                                    loadIfNeeded(right, builder)
                                )
                            );
                        }
                    }
                }


                
               
            }
            case ts.SyntaxKind.MinusEqualsToken:
            case ts.SyntaxKind.MinusToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFSub(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a * b
            case ts.SyntaxKind.AsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFMul(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a == b
            case ts.SyntaxKind.EqualsEqualsToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                if (left.getType() != right.getType()) {
                    console.log("LHS Type: " + left.getType());
                    console.log("RHS Type: " + right.getType());
                    //TODO: Handle Type conversions
                    throw new UnsupportedError (node, "Type conversions unsupported");
                } else {
                    switch (left.getType()) {
                        case ValueTypeEnum.STRING: {
                            if (!ctx.apiFunction.has("__str_cmp")) {
                                let return_type = new NativeType(llvm.Type.getInt32Ty(ctx.llvmContext));
                                let params = [llvm.Type.getInt8PtrTy(ctx.llvmContext), llvm.Type.getInt8PtrTy(ctx.llvmContext)];
                                let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
                                let fn_name = "__str_cmp"; 
                                let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
                                let args = [loadIfNeeded(left, builder), loadIfNeeded(right, builder)]
                                let call_expr = builder.createCall(fn, args);

                                let res = builder.createICmpEQ(call_expr, llvm.ConstantInt.get(ctx.llvmContext, 0, 32));
                                ctx.apiFunction.set("__str_cmp", fn);
                                return new Primitive(res, ValueTypeEnum.BOOLEAN);
                            } else {
                                let fn = ctx.apiFunction.get("__str_cmp");
                                let args = [loadIfNeeded(left, builder), loadIfNeeded(right, builder)]
                                let call_expr = builder.createCall(fn, args);
                                let res = builder.createICmpEQ(call_expr, llvm.ConstantInt.get(ctx.llvmContext, 0, 32));
                                return new Primitive(res, ValueTypeEnum.BOOLEAN);
                            }
                        }

                        default:
                            return new Primitive(
                                builder.createFCmpOEQ(
                                    loadIfNeeded(left, builder),
                                    loadIfNeeded(right, builder)
                                )
                            );
                    }
                }
            }
            // a ** b
            case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
            case ts.SyntaxKind.AsteriskAsteriskToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createCall(
                        ctx.getIntrinsic('llvm.pow.f64'),
                        [
                            loadIfNeeded(left, builder),
                            loadIfNeeded(right, builder)
                        ]
                    )
                );
            }
            // a ^ b
            case ts.SyntaxKind.CaretEqualsToken:
            case ts.SyntaxKind.CaretToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createXor(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a >> b
            case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
            case ts.SyntaxKind.GreaterThanGreaterThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createAShr(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a << b
            case ts.SyntaxKind.LessThanLessThanEqualsToken:
            case ts.SyntaxKind.LessThanLessThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createShl(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a / b
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.SlashToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFDiv(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            // a % b
            case ts.SyntaxKind.PercentEqualsToken:
            case ts.SyntaxKind.PercentToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                return new Primitive(
                    builder.createFRem(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );
            }
            case ts.SyntaxKind.GreaterThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                // const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));
                // const rightInt = builder.createZExt(right, llvm.Type.getInt32Ty(ctx.llvmContext));

                // const leftInt = builder.createFPToSI(
                //     loadIfNeeded(left, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );
                // const rightInt = builder.createFPToSI(
                //     loadIfNeeded(right, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );

                return new Primitive(
                    builder.createFCmpOGT(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder),
                        'cmpGT'
                    ),
                    ValueTypeEnum.BOOLEAN
                );
            }

	        case ts.SyntaxKind.GreaterThanEqualsToken: {
		        const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

		        const gt = new Primitive(
                    builder.createFCmpOGT(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder),
                        'cmpGT'
                    ),
                    ValueTypeEnum.BOOLEAN
                );

		        const eq = new Primitive(
                    builder.createFCmpOEQ(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );

		        return new Primitive(
                    builder.createOr(
                        loadIfNeeded(gt, builder),
                        loadIfNeeded(eq, builder),
                        "or"
                    ),
                    ValueTypeEnum.BOOLEAN
                );
	    }
            case ts.SyntaxKind.LessThanToken: {
                const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

                // const leftInt = builder.createZExt(left, llvm.Type.getInt32Ty(ctx.llvmContext));
                // const rightInt = builder.createZExt(right, llvm.Type.getInt32Ty(ctx.llvmContext));

                // const leftInt = builder.createFPToSI(
                //     loadIfNeeded(left, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );
                //
                // const rightInt = builder.createFPToSI(
                //     loadIfNeeded(right, builder, ctx),
                //     llvm.Type.getInt32Ty(ctx.llvmContext)
                // );

                return new Primitive(
                    builder.createFCmpOLT(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder),
                        'cmpLT'
                    ),
                    ValueTypeEnum.BOOLEAN
                );
            }
	    case ts.SyntaxKind.LessThanEqualsToken: {
		const left = buildFromExpression(node.left, ctx, builder);
                const right = buildFromExpression(node.right, ctx, builder);

		const lt = new Primitive(
                    builder.createFCmpOLT(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder),
                        'cmpLT'
                    ),
                    ValueTypeEnum.BOOLEAN
                );

		const eq = new Primitive(
                    builder.createFCmpOEQ(
                        loadIfNeeded(left, builder),
                        loadIfNeeded(right, builder)
                    )
                );

		return new Primitive(
                    builder.createOr(
                        loadIfNeeded(lt, builder),
                        loadIfNeeded(eq, builder),
                        "or"
                    ),
                    ValueTypeEnum.BOOLEAN
                );


	    }
	    // Logical Or
	    case ts.SyntaxKind.BarBarToken: {
	    	const left = buildFromExpression(node.left, ctx, builder);
		    const right = buildFromExpression(node.right, ctx, builder);

		    return new Primitive(
		        builder.createOr(
			    loadIfNeeded(left, builder), 
			    loadIfNeeded(right, builder), 
			    "or"
		        ),
		        ValueTypeEnum.BOOLEAN
		    );
	    }

        case ts.SyntaxKind.AmpersandAmpersandToken: {
            const left = buildFromExpression(node.left, ctx, builder);
		    const right = buildFromExpression(node.right, ctx, builder);

            return new Primitive(
		        builder.createAnd(
			        loadIfNeeded(left, builder), 
			        loadIfNeeded(right, builder), 
			        "and"
		        ),
		        ValueTypeEnum.BOOLEAN
		    );

        }

        case ts.SyntaxKind.ExclamationEqualsToken: {
            const left = buildFromExpression(node.left, ctx, builder);
		    const right = buildFromExpression(node.right, ctx, builder);


            if (left.getType() != right.getType()) {
                console.log("LHS Type: " + left.getType());
                console.log("RHS Type: " + right.getType());
                //TODO: Handle Type conversions
                throw new UnsupportedError (node, "Type conversions unsupported");
            } else {
                switch (left.getType()) {
                    case ValueTypeEnum.STRING: {
                        if (!ctx.apiFunction.has("__str_cmp")) {
                            let return_type = new NativeType(llvm.Type.getInt32Ty(ctx.llvmContext));
                            let params = [llvm.Type.getInt8PtrTy(ctx.llvmContext), llvm.Type.getInt8PtrTy(ctx.llvmContext)];
                            let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
                            let fn_name = "__str_cmp"; 
                            let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
                            let args = [loadIfNeeded(left, builder), loadIfNeeded(right, builder)]
                            let call_expr = builder.createCall(fn, args);

                            let res = builder.createICmpNE(call_expr, llvm.ConstantInt.get(ctx.llvmContext, 0, 32));
                            ctx.apiFunction.set("__str_cmp", fn);
                            return new Primitive(res, ValueTypeEnum.BOOLEAN);
                        } else {
                            let fn = ctx.apiFunction.get("__str_cmp");
                            let args = [loadIfNeeded(left, builder), loadIfNeeded(right, builder)]
                            let call_expr = builder.createCall(fn, args);
                            let res = builder.createICmpNE(call_expr, llvm.ConstantInt.get(ctx.llvmContext, 0, 32));
                            return new Primitive(res, ValueTypeEnum.BOOLEAN);
                        }
                    }

                    case ValueTypeEnum.ARRAY: {
                        //Have an array comparison function here
                        //TODO: More sophisticated Array Comparison, just pointer to int conversion now
                        let l = builder.createPtrToInt(left.getValue(), llvm.Type.getInt64Ty(ctx.llvmContext));
                        let r = builder.createPtrToInt(right.getValue(), llvm.Type.getInt64Ty(ctx.llvmContext));
                        let res = builder.createICmpNE(l, r);
                        return new Primitive(res, ValueTypeEnum.BOOLEAN);

                    }

                    default:
                        return new Primitive(
                            builder.createFCmpONE(
                                loadIfNeeded(left, builder),
                                loadIfNeeded(right, builder)
                            )
                        );
                }
            }
        }
            default:
                throw new UnsupportedError(
                    node,
                    `Unsupported BinaryExpression.operator: "${node.operatorToken.kind}"`
                );
        }
    }
}
