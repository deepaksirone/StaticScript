import { Value } from "../../value";
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {Context} from "../../context";
import {CPPMangler} from "../../cpp.mangler";
import UnsupportedError from "../../../error";
import {NativeTypeResolver} from "../../native-type-resolver";
import {generate_runtime_struct_type} from "./generate-llvm-type"
import {buildFromExpression, loadIfNeeded, mangleNameFromDeclaration} from "../../index";

export function isAPIFunction(class_name: string, method_name: string): Boolean {
    switch (class_name) {
        case "MomentJS" : {
            switch (method_name) {
                case "toString": {
                    return true;
                }
                case "add": {
                    return true;
                }
                default: {
                    return false;
                }
            }
        }
        default: {
            return false;
        }
    }
}

function declareAPIFunction(class_name: string, method_name: string, method_call_node: ts.CallExpression, ctx: Context): llvm.Function {
    // TODO: Handle overloaded functions
    //let fn_name = class_name + "__" + method_name;

    const signature = ctx.typeChecker.getResolvedSignature(method_call_node);
    let fn_name = mangleNameFromDeclaration(<ts.SignatureDeclaration>signature.declaration, ctx, CPPMangler);

    if (ctx.apiFunction.has(fn_name)) {
        return ctx.apiFunction.get(fn_name);
    }

    const method_decl = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration));
    const return_type = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(method_decl.type), ctx);
    let _params = method_decl.parameters.map((parameter) => {
        if (parameter.type) {
            const nativeType = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(parameter.type), ctx);
            if (nativeType) {
                return nativeType.getType();
            }
        }

        throw new UnsupportedError(
            method_decl,
            `Unsupported Parameter in Method Declaration`
        );
    });

    let params = [generate_runtime_struct_type(class_name, ctx)];
    params.push(..._params);

    let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
    let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
    ctx.apiFunction.set(fn_name, fn);
    return fn;
}

export function generateAPIFunctionCall(class_name: string, 
    method_name: string, class_argument: Value, 
    method_call_node: ts.CallExpression, ctx: Context, builder: llvm.IRBuilder): llvm.Value {

    let fn = declareAPIFunction(class_name, method_name, method_call_node, ctx);

    let args = [class_argument.getValue()];
    args.push(...method_call_node.arguments.map((expr) => {
        return loadIfNeeded(
            buildFromExpression(<any>expr, ctx, builder), builder
        );
    }));

    let call = builder.createCall(fn, args);
    return call;
}