import s from "gulp";
import ts from "gulp-typescript";
import gulpTerser from "gulp-terser";
const { src, dest } = s;
const tsProject = ts.createProject("tsconfig.json");
export default async function () {
	tsProject
		.src()
		.pipe(tsProject())
		.pipe(
			gulpTerser({
				compress: true,
				ecma: 11,
				mangle: true,
				module: true,
				toplevel: true,
			})
		)
		.pipe(dest("."));
}
