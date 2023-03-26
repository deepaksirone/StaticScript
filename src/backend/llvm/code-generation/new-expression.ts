
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {NodeGenerateInterface} from "../node-generate.interface";
import {Context} from "../context";
import {ClassReference, ObjectReference, Value, Primitive} from "../value";
import {CPPMangler} from "../cpp.mangler";
import {buildCalleFromSignature, buildFromExpression, loadIfNeeded, buildCalleFromCallExpression, mangleNameFromDeclaration} from "../index";
import UnsupportedError from "../../error/unsupported.error";
import {generateConstructorCall} from "./api/ap-fns";
import {getFullnameFromCallExpression} from "../code-generation/call-expression"

export class NewExpressionGenerator implements NodeGenerateInterface<ts.NewExpression, Value> {
    generate(node: ts.NewExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        
        const reference = buildFromExpression(node.expression, ctx, builder);
        if (reference instanceof ClassReference) {
            // @todo hacks...
            //const signature = ctx.typeChecker.getResolvedSignature(node);
            //console.log(ts.SyntaxKind[signature.declaration.kind]);
            //console.log(node);
            //console.log(<ts.ConstructorDeclaration>signature.declaration);
            //(<any>signature.declaration).name = 'constructor';
            
            // TODO: Mangle names based on the arguments here
            //let method_name = 'constructor';
            //let method_name = mangleNameFromDeclaration(<ts.SignatureDeclaration>signature.declaration, ctx, CPPMangler);
            //console.log(`[New Expr] Generating Code for Method: ${method_name}`);
            //let parent = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration)).parent;
            //let parent_class = (<ts.ClassDeclaration>parent).name.escapedText.toString();

            //let llvm_type = 
            //console.log(`[New Expr] Parent Class Name: ${parent_class}`);
            //let fn_name = parent_class + "_" + method_name;
            //console.log(`[New Expr] Function Name: ${fn_name}`);

            /*if (isAPIFunction(parent_class, method_name)) {
                let api_struct = buildFromExpression(node.expression, ctx, builder);
                let call_expr = generateAPIFunctionCall(parent_class, method_name, api_struct, node, ctx, builder);
                console.log("Generated call expression for method call");
                return new ObjectReference(reference, call_expr);
            }*/

			//let fullName = getFullnameFromCallExpression(node);
			//console.log(`The full name: ${fullName}`);
			//const callle = buildCalleFromCallExpression(node, ctx, builder, fullName);
        
            //const constructorFn = buildCalleFromSignature(signature, ctx, builder, method_name);
            //if (!constructorFn) {
            //    throw new UnsupportedError(
            //        node,
            //        'Cannot build constructor to call new'
            //    );
            //}

            //const args = node.arguments.map((expr) => {
            //    return loadIfNeeded(
            //        buildFromExpression(<any>expr, ctx, builder), builder
            //    );
            //});

            return new ObjectReference(
                reference,
                generateConstructorCall(node, ctx, builder)
            );
        }

        throw new UnsupportedError(
            node,
            'Unsupported new operator on non class reference'
        );
    }
}
