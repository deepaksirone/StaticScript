
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {emitCondition, passNode} from "../index";

export class IfStatementCodeGenerator implements NodeGenerateInterface<ts.IfStatement, void> {
    generate(node: ts.IfStatement, ctx: Context, builder: llvm.IRBuilder): void {
	console.log("[IfStatementCodeGenerator] Here");
        /*const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.true");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);

        const next = llvm.BasicBlock.create(ctx.llvmContext, "if.end");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

        if (node.elseStatement) {
            const negativeBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.false");
            ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(negativeBlock);

            emitCondition(
                node.expression,
                ctx,
                builder,
                positiveBlock,
                negativeBlock
            );

            builder.setInsertionPoint(negativeBlock);
	    console.log("Else Statement Kind: " + ts.SyntaxKind[node.elseStatement.kind]);
            passNode(node.elseStatement, ctx, builder);

            if (!negativeBlock.getTerminator()) {
                builder.createBr(next);
            }
        } else {
            emitCondition(
                node.expression,
                ctx,
                builder,
                positiveBlock,
                next
            );
        }

        builder.setInsertionPoint(positiveBlock);
	//console.log("The then node: " + JSON.stringify(node.thenStatement));

        passNode(node.thenStatement, ctx, builder);

        if (!positiveBlock.getTerminator()) {
            builder.createBr(next);
        }

        builder.setInsertionPoint(next);*/
       	this.generateStub(node, ctx, builder);
    }

    generateStub(node: ts.IfStatement, ctx: Context, builder: llvm.IRBuilder, nextBlock?: llvm.BasicBlock): void {
	const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.true");
	ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);

	const next : llvm.BasicBlock = nextBlock ? nextBlock : llvm.BasicBlock.create(ctx.llvmContext, "if.end");
	ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);

	if (node.elseStatement) {
		const negativeBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.false");
		ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(negativeBlock);			
			
		emitCondition(
			node.expression,
			ctx,
			builder,
			positiveBlock,
			negativeBlock);
		builder.setInsertionPoint(negativeBlock);
		if (node.elseStatement.kind == ts.SyntaxKind.IfStatement) {
			console.log("[generateStub] Elif found");
			this.generateStub(<any>node.elseStatement, ctx, builder, next);
		} else {
			passNode(node.elseStatement, ctx, builder);
		}

		if (!negativeBlock.getTerminator()) {
                	builder.createBr(next);
            	}
	} else {
		emitCondition(
			node.expression,
			ctx,
			builder,
			positiveBlock,
			next
		);
	}

	builder.setInsertionPoint(positiveBlock);
	
	passNode(node.thenStatement, ctx, builder);
	if (!positiveBlock.getTerminator()) {
		builder.createBr(next);
	}

	builder.setInsertionPoint(next);
    }
}
