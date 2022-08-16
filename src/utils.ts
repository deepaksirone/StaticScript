
import * as child_process from "child_process";
import * as path from "path";

let llvmBinDir: string | undefined;

function getLLVMBinDirectory(): string {
    if (!llvmBinDir) {
        llvmBinDir = child_process.execFileSync('llvm-config', ["--bindir"]).toString().trim();
    }

    return llvmBinDir;
}

export function executeLLCSync(options: Array<any>): Buffer|string {
    return child_process.execFileSync(
        path.join(getLLVMBinDirectory(), 'llc'),
        options
    )
}

export function executeOptSync(options: Array<any>): Buffer|string {
    return child_process.execFileSync(
        path.join(getLLVMBinDirectory(), 'opt'),
        options
    )
}

export function executeSedSync(options: Array<any>): Buffer|string {
	return child_process.execFileSync(
		'sed',
		options
	)
}

export function executeLLVMDisSync(options: Array<any>): Buffer|string {
	return child_process.execFileSync(
		path.join(getLLVMBinDirectory(), 'llvm-dis'),
		options
	)
}

export function executeARSync(options: Array<any>): Buffer|string {
        return child_process.execFileSync(
                'ar',
                options
        )
}

