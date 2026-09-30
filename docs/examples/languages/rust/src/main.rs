// Roll dice from Rust: run the command line, read its JSON.
use std::process::Command;

fn main() {
    let done = Command::new("koro")
        .args(["2d20kh1+5", "--seed", "table", "--json"])
        .output()
        .expect("koro is on the path");
    if !done.status.success() {
        panic!("{}", String::from_utf8_lossy(&done.stderr));
    }
    let result: serde_json::Value = serde_json::from_slice(&done.stdout).expect("JSON");
    assert_eq!(result["format"], 1);
    // 24: the dice were 19 and 12, the 19 kept, plus 5
    println!("{}", result["rolls"][0]["total"]);
}
