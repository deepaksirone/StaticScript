
import * as ts from "typescript";
import * as llvm from 'llvm-node';

import {Context} from "../../context";


export function generate_runtime_struct_type(type: string, ctx: Context): llvm.Type {
    switch (type) {
        case "MomentJS": {
            return llvm.StructType.get(ctx.llvmContext, [llvm.Type.getDoubleTy(ctx.llvmContext)]);
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