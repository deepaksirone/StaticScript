
import * as ts from "typescript";
import * as llvm from 'llvm-node';
import {Context} from "../context";
import {Primitive, Value, ValueTypeEnum} from "../value";
import {NodeGenerateInterface} from "../node-generate.interface";
import { buildFromExpression, buildFromTemplateHeadMiddleOrTail } from "..";
import { NativeType } from "../native-type";
import { loadIfNeeded } from "..";
import UnsupportedError from "../../error/unsupported.error";

function concat_strings(str1: Value, str2: Value, ctx: Context, builder: llvm.IRBuilder): Value {
    if (!ctx.apiFunction.has("__str_concat")) {
        let return_type = new NativeType(llvm.Type.getInt8PtrTy(ctx.llvmContext));
        let params = [llvm.Type.getInt8PtrTy(ctx.llvmContext), llvm.Type.getInt8PtrTy(ctx.llvmContext)];
        let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
        let fn_name = "__str_concat"; 
        let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
        let args = [loadIfNeeded(str1, builder), loadIfNeeded(str2, builder)]
        let call_expr = builder.createCall(fn, args);
        ctx.apiFunction.set("__str_concat", fn);
        return new Primitive(call_expr, ValueTypeEnum.STRING);
    } else {
        let fn = ctx.apiFunction.get("__str_concat");
        let args = [loadIfNeeded(str1, builder), loadIfNeeded(str2, builder)]
        let call_expr = builder.createCall(fn, args);
        return new Primitive(call_expr, ValueTypeEnum.STRING);
    }
}

function stringify_number(number: Value, ctx: Context, builder: llvm.IRBuilder): Value {
    if (!ctx.apiFunction.has("_Z16Number__toStringv")) {
        let return_type = new NativeType(llvm.Type.getInt8PtrTy(ctx.llvmContext));
        let params = [llvm.Type.getDoubleTy(ctx.llvmContext)];
        let fn_type = llvm.FunctionType.get(return_type.getType(), params, false);
        let fn_name = "_Z16Number__toStringv";
        let fn = llvm.Function.create(fn_type, llvm.LinkageTypes.ExternalLinkage, fn_name, ctx.llvmModule);
        let args = [loadIfNeeded(number, builder)];
        let call_expr = builder.createCall(fn, args);
        ctx.apiFunction.set("_Z16Number__toStringv", fn);
        return new Primitive(call_expr, ValueTypeEnum.STRING);
    } else {
        let fn = ctx.apiFunction.get("_Z16Number__toStringv");
        let args = [loadIfNeeded(number, builder)]
        let call_expr = builder.createCall(fn, args);
        return new Primitive(call_expr, ValueTypeEnum.STRING);
    }
}

export class TemplateExpressionCodeGenerator implements NodeGenerateInterface<ts.TemplateExpression, Value> {
    generate(node: ts.TemplateExpression, ctx: Context, builder: llvm.IRBuilder): Value {
        var start = buildFromTemplateHeadMiddleOrTail(node.head, ctx, builder);
        node.templateSpans.forEach((span, idx, arr) => {
            start = concat_strings(start, this.process_span(span, ctx, builder), ctx, builder);
        })

        return start;
    }

    //TODO: Write a function which parses and concatenates each span
    process_span(span: ts.TemplateSpan, ctx: Context, builder: llvm.IRBuilder): Value {
        console.log(span)
        const expr_val = buildFromExpression(span.expression, ctx, builder);
        const next_val = buildFromTemplateHeadMiddleOrTail(span.literal, ctx, builder);
        switch (expr_val.getType()) {
            case ValueTypeEnum.STRING:
                return concat_strings(expr_val, next_val, ctx, builder);
            case ValueTypeEnum.DOUBLE: {
                var st = stringify_number(expr_val, ctx, builder);
                return concat_strings(st, next_val, ctx, builder);
            }
            default:
                //TODO: stringify double
                console.log(expr_val.getType())
                throw new UnsupportedError(span, "Stringifying non string variables not supported");
        }
    }

}