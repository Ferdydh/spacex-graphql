export function hashStr(str:string): number {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
      var charCode = str.charCodeAt(i);
      hash += charCode;
  }
  return hash;
}