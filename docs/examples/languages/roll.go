// Roll dice from Go: run the command line, read its JSON.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
)

type roll struct {
	Notation string `json:"notation"`
	Faces    []int  `json:"faces"`
	Kept     []bool `json:"kept"`
	Total    int    `json:"total"`
}

type result struct {
	Format int    `json:"format"`
	Rolls  []roll `json:"rolls"`
}

func main() {
	out, err := exec.Command("koro", "2d20kh1+5", "--seed", "table", "--json").Output()
	if err != nil {
		log.Fatal(err)
	}
	var got result
	if err := json.Unmarshal(out, &got); err != nil {
		log.Fatal(err)
	}
	if got.Format != 1 {
		log.Fatal("this reads format 1")
	}
	fmt.Println(got.Rolls[0].Total) // 24: the dice were 19 and 12, the 19 kept, plus 5
}
