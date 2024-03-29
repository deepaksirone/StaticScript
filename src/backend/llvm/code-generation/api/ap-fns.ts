import { Value } from "../../value";
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {Context} from "../../context";
import {CPPMangler} from "../../cpp.mangler";
import UnsupportedError from "../../../error";
import {NativeTypeResolver} from "../../native-type-resolver";
import {generate_runtime_struct_type} from "./generate-llvm-type"
import {buildFromExpression, loadIfNeeded, mangleNameFromDeclaration} from "../../index";
import { NativeType } from "../../native-type";

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
                case "day": {
                    return true;
                }
                case "hour": {
                    return true;
                }
                default: {
                    return false;
                }
            }
        }

        case "Number" : {
            switch (method_name) {
                case "toString": {
                    return true;
                }
                case "toFixed": {
                    return true;
                }
                default: {
                    return false;
                }
            }
        }

        case "String" : {
            switch (method_name) {
                case "match": {
                    return true;
                }
                case "concat": {
                    return true;
                }
                case "replace": {
                    return true;
                }
                case "indexOf": {
                    return true;
                }
                case "trim": {
                    return true;
                }
                case "charAt": {
                    return true;
                }
                case "toUpperCase": {
                    return true;
                }
                case "toLowerCase": {
                    return true;
                }
                case "split": {
                    return true;
                }
                case "slice": {
                    return true;
                }
                case "lastIndexOf": {
                    return true;
                }
                case "substring": {
                    return true;
                }
                default: {
                    return false;
                }
            }
        }

        case "Array": {
            switch (method_name) {
                case "toString": {
                    return true;
                }
                case "length": {
                    return true;
                }                
                case "join": {
                    return true;
                }
                default: {
                    return false;
                }
            }
        }

        case "RegExp": {
            switch (method_name) {
                case "exec": {
                    return true;
                }

                case "test": {
                    return true;
                }

                default: {
                    return false;
                }
            }
        }

        case "Time": {
            switch (method_name) {
                case "format": {
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

function declareAPIFunction(class_name: string, method_name: string, method_call_node: ts.CallExpression, ctx: Context): [llvm.Function, NativeType] {
    // TODO: Handle overloaded functions
    //let fn_name = class_name + "__" + method_name;

    const signature = ctx.typeChecker.getResolvedSignature(method_call_node);
    let fn_name = mangleNameFromDeclaration(<ts.SignatureDeclaration>signature.declaration, ctx, CPPMangler);

    if (ctx.signature.has(signature)) {
        const method_decl = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration));
        const return_type = NativeTypeResolver.getType(ctx.typeChecker.getTypeFromTypeNode(method_decl.type), ctx);
        return [ctx.signature.get(signature), return_type];
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

    //FIXME: Extremely hacky, use this to have the pointer of the runtime struct as the parameter
    let runtime_param = generate_runtime_struct_type(class_name, ctx);
    let params = [];
    if (runtime_param instanceof llvm.StructType || runtime_param instanceof llvm.ArrayType) {
        params = [llvm.PointerType.get(runtime_param, 0)];
    } else {
        params = [runtime_param];
    }

    params.push(..._params);

    let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
    let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
    ctx.signature.set(signature, fn);
    // Testing setting this here
    ctx.apiFunction.set(fn_name, fn);
    return [fn, return_type];
}

function declareConstructorFunction(node: ts.NewExpression, ctx: Context, builder: llvm.IRBuilder): llvm.Function {
    const signature = ctx.typeChecker.getResolvedSignature(node);
    (<any>signature.declaration).name = 'constructor';

    if (ctx.signature.has(signature)) {
        return ctx.signature.get(signature);
    }

    let fn_name = mangleNameFromDeclaration(<ts.SignatureDeclaration>signature.declaration, ctx, CPPMangler);
    //console.log(`[New Expr] Generating Code for Method: ${method_name}`);
    const method_decl = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration));
    let parent = (<ts.MethodDeclaration>(<ts.SignatureDeclaration>signature.declaration)).parent;
    let parent_class = (<ts.ClassDeclaration>parent).name.escapedText.toString();

    let return_type = generate_runtime_struct_type(parent_class, ctx);
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

    let fn_type = llvm.FunctionType.get(return_type, _params, false);

    let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
    ctx.signature.set(signature, fn);

    return fn;

}

export function generateAPIFunctionCall(class_name: string, 
    method_name: string, class_argument: Value, 
    method_call_node: ts.CallExpression, ctx: Context, builder: llvm.IRBuilder): [llvm.CallInst, NativeType] {

    let fn = declareAPIFunction(class_name, method_name, method_call_node, ctx);

    let args = [loadIfNeeded(class_argument, builder)];
    args.push(...method_call_node.arguments.map((expr) => {
        return loadIfNeeded(
            buildFromExpression(<any>expr, ctx, builder), builder
        );
    }));

    let call = builder.createCall(fn[0], args);
    return [call, fn[1]];
}

export function generateConstructorCall(node: ts.NewExpression, ctx: Context, builder: llvm.IRBuilder): llvm.CallInst {
    
    let fn = declareConstructorFunction(node, ctx, builder);

    const args = node.arguments.map((expr) => {
        return loadIfNeeded(
            buildFromExpression(<any>expr, ctx, builder), builder
        );
    });

    let call = builder.createCall(fn, args);
    return call;

}