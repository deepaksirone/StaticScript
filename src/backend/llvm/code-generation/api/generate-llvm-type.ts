
import * as ts from "typescript";
import * as llvm from 'llvm-node';

import {Context} from "../../context";


export function generate_runtime_struct_type(type: string, ctx: Context): llvm.Type {
    switch (type) {
        case "MomentJS": {
            return llvm.StructType.get(ctx.llvmContext, [llvm.Type.getDoubleTy(ctx.llvmContext)]);
        }
        case "Number" : {
            return llvm.Type.getDoubleTy(ctx.llvmContext);
        }
        case "String" : {
            return llvm.Type.getInt8PtrTy(ctx.llvmContext);
        }
        default: 
            throw new Error(
                `Unsupported type, "${type}"`
            );
    }
}

export function isJSRuntimeType(type: string) {
    switch (type) {
        case "MomentJS": return true;
        default: return false;
    }
}