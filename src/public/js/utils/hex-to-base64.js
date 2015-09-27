export default function (string) {
	return btoa(String.fromCharCode.apply(null, string.match(/([\da-fA-F]{2})/g).map((charCode) => parseInt(charCode, 16))));
}
