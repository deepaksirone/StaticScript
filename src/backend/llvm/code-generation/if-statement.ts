
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {emitCondition, passNode} from "../index";

export class IfStatementCodeGenerator implements NodeGenerateInterface<ts.IfStatement, void> {
    
    /*generate(node: ts.IfStatement, ctx: Context, builder: llvm.IRBuilder): void {
	    this.generateStub(node, ctx, builder);
    }*/

    generate(node: ts.IfStatement, ctx: Context, builder: llvm.IRBuilder): void {
        const positiveBlock = llvm.BasicBlock.create(ctx.llvmContext, "if.true");
        ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(positiveBlock);
	
	//console.log("The next block: " + JSON.stringify(nextBlock));
	//const nextNotUndefined = typeof nextBlock !== 'undefined';
        /*const next = typeof nextBlock !== 'undefined' ? nextBlock : llvm.BasicBlock.create(ctx.llvmContext, "if.end");
	if (!nextBlock) {
        	ctx.scope.enclosureFunction.llvmFunction.addBasicBlock(next);
	}*/
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
	    /*if (node.elseStatement.kind == ts.SyntaxKind.IfStatement) {
                        console.log("[generateStub] Elif found");
                        this.generateStub(<any>node.elseStatement, ctx, builder, next);
            } else {*/
            passNode(node.elseStatement, ctx, builder);
 
            //if (!negativeBlock.getTerminator()) {
            builder.createBr(next);
            //}

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

        //if (!positiveBlock.getTerminator()) {
        builder.createBr(next);
        //}

        builder.setInsertionPoint(next);
    }
}
