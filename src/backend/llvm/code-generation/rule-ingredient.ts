import * as ts from "typescript";
import * as llvm from 'llvm-node';


let IngredientNames: Array<string> = ["Weather_tomorrowsForecastCallsFor_ConditionImageURL"];
let IngredientTypes: Array<string> = ["string"];

export function IsRuleIngredient(candidate: string, ctx: llvm.LLVMContext): [boolean, llvm.Type] {
	let idx = IngredientNames.indexOf(candidate);
	if (idx == -1) {
		return [false, null];
	}

	switch (IngredientTypes[idx]) {
		case "string": {
			let stringPtrType = llvm.Type.getInt8PtrTy(ctx);
			return [true, stringPtrType];
		}
		case "integer": {
			let doublePtrType = llvm.Type.getDoubleTy(ctx);
			return [true, doublePtrType];
		}
		default: {
                        let doublePtrType = llvm.Type.getDoubleTy(ctx);
                        return [true, doublePtrType];
                }
	}

}

