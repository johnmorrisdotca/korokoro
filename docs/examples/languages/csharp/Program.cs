// Roll dice from C#: run the command line, read its JSON.
using System.Diagnostics;
using System.Text.Json;

var start = new ProcessStartInfo("koro") { RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false };
foreach (var arg in new[] { "2d20kh1+5", "--seed", "table", "--json" }) start.ArgumentList.Add(arg);
using var koro = Process.Start(start)!;
var text = koro.StandardOutput.ReadToEnd();
koro.WaitForExit();
if (koro.ExitCode != 0) throw new Exception(koro.StandardError.ReadToEnd());

using var result = JsonDocument.Parse(text);
if (result.RootElement.GetProperty("format").GetInt32() != 1) throw new Exception("this reads format 1");
// 24: the dice were 19 and 12, the 19 kept, plus 5
Console.WriteLine(result.RootElement.GetProperty("rolls")[0].GetProperty("total").GetInt32());
