
import * as llvm from 'llvm-node';
import * as ts from 'typescript';
import {Context} from "./context";
import UnsupportedError from "../error/unsupported.error";
import {loadIfNeeded} from "./index";

export enum ValueTypeEnum {
    STRING = 'STRING',
    DOUBLE = 'DOUBLE',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    //
    UNKNOWN = 'UNKNOWN',
    OBJECT = 'OBJECT',
    ARRAY = 'ARRAY',
    //
    INT8 = 'INT8',
    INT16 = 'INT16',
    INT32 = 'INT32',
    INT64 = 'INT64',
    INT128 = 'INT128',
}

export function convertLLVMTypeToValueType(type: llvm.Type) {
    switch (type.typeID) {
    case llvm.Type.TypeID.DoubleTyID:
            return ValueTypeEnum.DOUBLE;
	case llvm.Type.TypeID.PointerTyID: {
	    console.log("[convertLLVMTypeToValueType] Returning string type");
        let typ = type as llvm.PointerType;
        if (typ.elementType instanceof llvm.ArrayType) {
	        return ValueTypeEnum.ARRAY;
        } else if (typ.elementType instanceof llvm.IntegerType) {
            return ValueTypeEnum.STRING;
        } else {
            // Runtime API structs
            return ValueTypeEnum.OBJECT;
        }
	}
	case llvm.Type.TypeID.FunctionTyID: {
	    const fnType = type as llvm.FunctionType;
	    console.log("[convertLLVMTypeToValueType] Converting function type");
	    return convertLLVMTypeToValueType(fnType.returnType);
	}

    case llvm.Type.TypeID.IntegerTyID: {
        let typ = type as llvm.IntegerType;
        if (typ.getBitWidth() == 1) {
            return ValueTypeEnum.BOOLEAN;
        }
    }

    default:
            return ValueTypeEnum.UNKNOWN;
    }
}

export interface Value {
    getValue(): llvm.Value;
    getType(): ValueTypeEnum;

    toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value;
    isString(): boolean;
}

export class FunctionReference implements Value {
    public llvmValue: llvm.Function;

    constructor(llvmValue: llvm.Function) {
        this.llvmValue = llvmValue;
    }

    getValue(): llvm.Value {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        throw new Error('It is not a Primitive, it is FunctionReference (=ↀωↀ=)');
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class ArrayReference implements Value {
    public elementType: llvm.Type;
    public llvmValue: llvm.Value;
    public numElements: number;

    constructor(elementType: llvm.Type, llvmValue: llvm.Value, numElements: number) {
        this.elementType = elementType;
        this.llvmValue = llvmValue;
	    this.numElements = numElements;
    }

    getValue(): llvm.Value {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        return ValueTypeEnum.ARRAY;
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        if (this.llvmValue.type.isPointerTy()) {
            // Convert the array pointer to integer and insert a null check
            let val = builder.createPtrToInt(this.llvmValue, llvm.Type.getInt64Ty(ctx.llvmContext));
            return new Primitive(
                builder.createICmpNE(
                    val,
                    llvm.ConstantInt.get(ctx.llvmContext, 0, 64)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        throw new UnsupportedError(node, 'Cannot cast ArrayReference to boolean');
    }

    public isString(): boolean {
        return false;
    }

    public getNumElements(): number {
	    return this.numElements;
    }
}

export class ObjectReference implements Value {
    public classReference: ClassReference;
    public llvmValue: llvm.CallInst;

    constructor(classReference: ClassReference, llvmValue: llvm.CallInst) {
        this.classReference = classReference;
        this.llvmValue = llvmValue;
    }

    getValue(): llvm.CallInst {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        //throw new Error('It is not a Primitive, it is ObjectReference (=ↀωↀ=)');
        return ValueTypeEnum.OBJECT;
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class ClassReference implements Value {
    public structType: llvm.StructType;

    getValue(): llvm.Value {
        throw new Error('It is not a real value, it is ClassReference (=ↀωↀ=)');
    }

    getType(): ValueTypeEnum {
        throw new Error('It is not a Primitive, it is ClassReference (=ↀωↀ=)');
    }

    constructor(structType: llvm.StructType) {
        this.structType = structType;
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        throw new UnsupportedError(node, 'Cannot cast ClassReference to boolean');
    }

    public isString(): boolean {
        return false;
    }
}

export class Primitive implements Value {
    public llvmValue: llvm.Value;
    public type: ValueTypeEnum;

    getValue(): llvm.Value {
        return this.llvmValue;
    }

    getType(): ValueTypeEnum {
        return this.type;
    }

    constructor(llvmValue: llvm.Value, type?: ValueTypeEnum) {
        this.llvmValue = llvmValue;
        this.type = type || convertLLVMTypeToValueType(llvmValue.type);
    }

    public toBoolean(ctx: Context, builder: llvm.IRBuilder, node: ts.Node): Value {
        if (this.type == ValueTypeEnum.BOOLEAN) {
            return this;
        }

        const value = loadIfNeeded(this, builder);

        if (value.type.isDoubleTy()) {
            return new Primitive(
                builder.createFCmpONE(
                    value,
                    llvm.ConstantFP.get(ctx.llvmContext, 0)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        if (value.type.isIntegerTy()) {
            if (value.type.isIntegerTy(1)) {
                return new Primitive(
                    value,
                    ValueTypeEnum.BOOLEAN
                );
            }

            return new Primitive(
                builder.createICmpNE(
                    value,
                    llvm.ConstantInt.get(ctx.llvmContext, 0)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        if (value.type.isPointerTy()) {
            let val = builder.createPtrToInt(this.llvmValue, llvm.Type.getInt64Ty(ctx.llvmContext));
            return new Primitive(
                builder.createICmpNE(
                    val,
                    llvm.ConstantInt.get(ctx.llvmContext, 0, 64)
                ),
                ValueTypeEnum.BOOLEAN
            );
        }

        throw new UnsupportedError(
            node,
            `Unsupported cast ${this.llvmValue.type} to boolean`
        );
    }

    public isString(): boolean {
        return this.type === ValueTypeEnum.STRING;
    }
}
