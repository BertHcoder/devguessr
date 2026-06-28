import type { Category, Question } from './types.js';

/** A question authored without its multiple-choice options. Options are
 *  generated per-game from the category answer pool so each match feels fresh. */
export type RawQuestion = Omit<Question, 'options'>;

/* -------------------------------------------------------------------------- */
/*  LANGUAGE QUESTIONS — guess the programming language from a code snippet.   */
/* -------------------------------------------------------------------------- */

const languages: RawQuestion[] = [
  {
    id: 'lang-python',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Python',
    highlight: 'python',
    fact: 'Named after Monty Python, not the snake.',
    code: `def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print([fib(i) for i in range(10)])`,
  },
  {
    id: 'lang-rust',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Rust',
    highlight: 'rust',
    fact: 'Its borrow checker enforces memory safety without a garbage collector.',
    code: `fn main() {
    let mut nums = vec![5, 2, 8, 1];
    nums.sort();
    for n in &nums {
        println!("{}", n);
    }
}`,
  },
  {
    id: 'lang-go',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Go',
    highlight: 'go',
    fact: 'Goroutines make concurrency cheap and built-in.',
    code: `package main

import "fmt"

func main() {
	ch := make(chan int)
	go func() { ch <- 42 }()
	fmt.Println(<-ch)
}`,
  },
  {
    id: 'lang-typescript',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'TypeScript',
    highlight: 'typescript',
    fact: 'A typed superset of JavaScript created at Microsoft.',
    code: `interface User {
  id: number;
  name: string;
}

const greet = (u: User): string => \`Hi \${u.name}\`;
console.log(greet({ id: 1, name: "Ada" }));`,
  },
  {
    id: 'lang-javascript',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'JavaScript',
    highlight: 'javascript',
    fact: 'Created in just 10 days in 1995.',
    code: `const nums = [1, 2, 3, 4];
const doubled = nums
  .filter((n) => n % 2 === 0)
  .map((n) => n * 2);
console.log(doubled);`,
  },
  {
    id: 'lang-csharp',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'C#',
    highlight: 'csharp',
    fact: 'Pronounced "C-sharp", built for the .NET platform.',
    code: `using System;

class Program {
    static void Main() {
        var items = new[] { 3, 1, 2 };
        Array.Sort(items);
        Console.WriteLine(string.Join(",", items));
    }
}`,
  },
  {
    id: 'lang-java',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Java',
    highlight: 'java',
    fact: '"Write once, run anywhere" on the JVM.',
    code: `public class Main {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.println("Hello " + i);
        }
    }
}`,
  },
  {
    id: 'lang-cpp',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'C++',
    highlight: 'cpp',
    fact: 'Originally called "C with Classes".',
    code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> v{4, 8, 15};
    for (auto& x : v) std::cout << x << "\\n";
    return 0;
}`,
  },
  {
    id: 'lang-ruby',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Ruby',
    highlight: 'ruby',
    fact: 'Designed for programmer happiness.',
    code: `[1, 2, 3, 4].select(&:even?).each do |n|
  puts "#{n} is even"
end`,
  },
  {
    id: 'lang-php',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'PHP',
    highlight: 'php',
    fact: 'Powers a large share of the web, including WordPress.',
    code: `<?php
$names = ["Sam", "Lee", "Max"];
foreach ($names as $name) {
    echo "Hello, $name\\n";
}`,
  },
  {
    id: 'lang-swift',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Swift',
    highlight: 'swift',
    fact: "Apple's modern language for iOS and macOS apps.",
    code: `let scores = [88, 92, 75]
let total = scores.reduce(0, +)
print("Average: \\(total / scores.count)")`,
  },
  {
    id: 'lang-kotlin',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Kotlin',
    highlight: 'kotlin',
    fact: 'The preferred language for modern Android development.',
    code: `fun main() {
    val names = listOf("Kim", "Ola", "Ravi")
    names.filter { it.length > 2 }
         .forEach { println(it) }
}`,
  },
  {
    id: 'lang-sql',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'SQL',
    highlight: 'sql',
    fact: 'A declarative language for querying relational databases.',
    code: `SELECT department, COUNT(*) AS people
FROM employees
WHERE active = 1
GROUP BY department
ORDER BY people DESC;`,
  },
  {
    id: 'lang-bash',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Bash',
    highlight: 'bash',
    fact: 'The default shell on most Linux systems.',
    code: `#!/usr/bin/env bash
for file in *.log; do
  echo "Processing $file"
  gzip "$file"
done`,
  },
  {
    id: 'lang-haskell',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Haskell',
    highlight: 'haskell',
    fact: 'A purely functional language with lazy evaluation.',
    code: `primes :: [Int]
primes = sieve [2..]
  where sieve (p:xs) =
          p : sieve [x | x <- xs, x \`mod\` p /= 0]`,
  },
  {
    id: 'lang-elixir',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Elixir',
    highlight: 'elixir',
    fact: 'Runs on the battle-tested Erlang virtual machine (BEAM).',
    code: `defmodule Greeter do
  def hello(name), do: IO.puts("Hello, #{name}!")
end

[~c"Ann", ~c"Bo"] |> Enum.each(&Greeter.hello/1)`,
  },
  {
    id: 'lang-scala',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Scala',
    highlight: 'scala',
    fact: 'Fuses object-oriented and functional programming on the JVM.',
    code: `object Main extends App {
  val nums = List(5, 2, 8, 1)
  val sorted = nums.sortWith(_ < _)
  sorted.foreach(println)
}`,
  },
  {
    id: 'lang-clojure',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Clojure',
    highlight: 'clojure',
    fact: 'A modern Lisp dialect that runs on the JVM.',
    code: `(defn fib [n]
  (take n
    (map first
      (iterate (fn [[a b]] [b (+ a b)]) [0 1]))))

(println (fib 10))`,
  },
  {
    id: 'lang-lua',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Lua',
    highlight: 'lua',
    fact: 'A lightweight scripting language embedded in many games.',
    code: `local t = {3, 1, 2}
table.sort(t)
for i, v in ipairs(t) do
  print(i, v)
end`,
  },
  {
    id: 'lang-perl',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Perl',
    highlight: 'perl',
    fact: 'Once called the "duct tape" of the internet.',
    code: `my @words = qw(beta alpha gamma);
my @sorted = sort @words;
print "$_\n" for @sorted;`,
  },
  {
    id: 'lang-r',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'R',
    highlight: 'r',
    fact: 'The go-to language for statistics and data analysis.',
    code: `nums <- c(4, 8, 15, 16, 23, 42)
squared <- sapply(nums, function(x) x^2)
print(mean(squared))`,
  },
  {
    id: 'lang-julia',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Julia',
    highlight: 'julia',
    fact: 'Designed for high-performance numerical computing.',
    code: `function mandel(c)
    z = 0
    for i in 1:100
        z = z^2 + c
        abs(z) > 2 && return i
    end
    return 100
end`,
  },
  {
    id: 'lang-fsharp',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'F#',
    highlight: 'fsharp',
    fact: 'A functional-first language on the .NET platform.',
    code: `let rec factorial n =
    match n with
    | 0 -> 1
    | _ -> n * factorial (n - 1)

printfn "%d" (factorial 5)`,
  },
  {
    id: 'lang-ocaml',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'OCaml',
    highlight: 'ocaml',
    fact: 'An ML-family language; inspired Rust and ReasonML.',
    code: `let rec sum = function
  | [] -> 0
  | x :: xs -> x + sum xs

let () = Printf.printf "%d\n" (sum [1; 2; 3; 4])`,
  },
  {
    id: 'lang-zig',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Zig',
    highlight: 'zig',
    fact: 'A modern systems language aiming to replace C, with no hidden control flow.',
    code: `const std = @import("std");

pub fn main() void {
    var sum: u32 = 0;
    for (0..10) |i| {
        sum += @intCast(i);
    }
    std.debug.print("{}\n", .{sum});
}`,
  },
  {
    id: 'lang-erlang',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Erlang',
    highlight: 'erlang',
    fact: 'Built by Ericsson for telecom systems with nine-nines uptime.',
    code: `-module(fact).
-export([calc/1]).

calc(0) -> 1;
calc(N) -> N * calc(N - 1).`,
  },
  {
    id: 'lang-dart',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Dart',
    highlight: 'dart',
    fact: 'The language powering Flutter, optimized for UI.',
    code: `void main() {
  final nums = [3, 1, 2]..sort();
  for (final n in nums) {
    print(n);
  }
}`,
  },
  {
    id: 'lang-cobol',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'COBOL',
    highlight: 'cobol',
    fact: 'Born in 1959; still runs much of the world\'s banking systems.',
    code: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. HELLO.
       PROCEDURE DIVISION.
           DISPLAY "HELLO, WORLD!".
           STOP RUN.`,
  },
  {
    id: 'lang-fortran',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Fortran',
    highlight: 'fortran',
    fact: 'The first widely used high-level language, dating to 1957.',
    code: `program squares
  integer :: i
  do i = 1, 5
    print *, i, i**2
  end do
end program squares`,
  },
  {
    id: 'lang-lisp',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Lisp',
    highlight: 'lisp',
    fact: 'One of the oldest languages; famous for its parentheses.',
    code: `(defun factorial (n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))

(print (factorial 5))`,
  },
  {
    id: 'lang-assembly',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Assembly',
    highlight: 'nasm',
    fact: 'As close to the bare metal as human-readable code gets.',
    code: `section .text
  global _start
_start:
  mov rax, 60
  mov rdi, 0
  syscall`,
  },
  {
    id: 'lang-c',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'C',
    highlight: 'c',
    fact: 'Created by Dennis Ritchie at Bell Labs in the early 1970s.',
    code: `#include <stdio.h>

int main(void) {
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    printf("%d\\n", sum);
    return 0;
}`,
  },
  {
    id: 'lang-objc',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Objective-C',
    highlight: 'objectivec',
    fact: "Apple's main language before Swift; note the @ literals and bracket calls.",
    code: `#import <Foundation/Foundation.h>

int main() {
    NSArray *names = @[@"Sam", @"Lee"];
    for (NSString *name in names) {
        NSLog(@"Hello, %@", name);
    }
    return 0;
}`,
  },
  {
    id: 'lang-groovy',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Groovy',
    highlight: 'groovy',
    fact: 'A dynamic JVM language and the basis of Gradle build scripts.',
    code: `def squares = (1..5).collect { it * it }
squares.each { println it }`,
  },
  {
    id: 'lang-matlab',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'MATLAB',
    highlight: 'matlab',
    fact: "Short for 'Matrix Laboratory'; nearly everything is a matrix.",
    code: `A = magic(4);
rowSums = sum(A, 2);
disp(rowSums)`,
  },
  {
    id: 'lang-pascal',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Pascal',
    highlight: 'pascal',
    fact: 'Designed by Niklaus Wirth to teach structured programming.',
    code: `program Sum;
var
  i, total: integer;
begin
  total := 0;
  for i := 1 to 10 do
    total := total + i;
  writeln(total);
end.`,
  },
  {
    id: 'lang-crystal',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Crystal',
    highlight: 'crystal',
    fact: 'Ruby-like syntax with static types and native, compiled speed.',
    code: `def add(a : Int32, b : Int32) : Int32
  a + b
end

puts add(2, 3)`,
  },
  {
    id: 'lang-nim',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Nim',
    highlight: 'nim',
    fact: 'Python-like syntax that compiles to C for native performance.',
    code: `proc factorial(n: int): int =
  result = 1
  for i in 1..n:
    result *= i

echo factorial(5)`,
  },
  {
    id: 'lang-solidity',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Solidity',
    highlight: 'solidity',
    fact: 'The main language for writing Ethereum smart contracts.',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;

    function increment() external {
        count += 1;
    }
}`,
  },
  {
    id: 'lang-powershell',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'PowerShell',
    highlight: 'powershell',
    fact: "Microsoft's object-oriented shell and scripting language.",
    code: `$files = Get-ChildItem -Filter *.log
foreach ($file in $files) {
    Write-Output "Compressing $($file.Name)"
}`,
  },
  {
    id: 'lang-gdscript',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'GDScript',
    highlight: 'gdscript',
    fact: 'The Python-inspired scripting language built into the Godot game engine.',
    code: `extends Node

func _ready():
    var total = 0
    for i in range(10):
        total += i
    print(total)`,
  },
  {
    id: 'lang-elm',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Elm',
    highlight: 'elm',
    fact: 'A purely functional language for the front end, famous for no runtime errors.',
    code: `import Html exposing (text)

main =
    text (String.fromInt (List.sum [1, 2, 3, 4]))`,
  },
  {
    id: 'lang-scheme',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Scheme',
    highlight: 'scheme',
    fact: 'A minimalist dialect of Lisp, famous from the book SICP.',
    code: `(define (factorial n)
  (if (= n 0)
      1
      (* n (factorial (- n 1)))))

(display (factorial 5))`,
  },
  {
    id: 'lang-prolog',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Prolog',
    highlight: 'prolog',
    fact: 'A logic language where you state facts and rules, not steps.',
    code: `factorial(0, 1).
factorial(N, F) :-
    N > 0,
    N1 is N - 1,
    factorial(N1, F1),
    F is N * F1.`,
  },
  {
    id: 'lang-ada',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Ada',
    highlight: 'ada',
    fact: 'Named after Ada Lovelace; favored in aviation and defense systems.',
    code: `with Ada.Text_IO; use Ada.Text_IO;

procedure Hello is
begin
   for I in 1 .. 5 loop
      Put_Line (Integer'Image (I));
   end loop;
end Hello;`,
  },
  {
    id: 'lang-d',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'D',
    highlight: 'd',
    fact: 'A systems language reimagining C++ with safer defaults.',
    code: `import std.stdio;

void main() {
    auto nums = [3, 1, 2];
    foreach (n; nums) {
        writeln(n);
    }
}`,
  },
  {
    id: 'lang-racket',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Racket',
    highlight: 'racket',
    fact: 'A Scheme descendant built for creating new programming languages.',
    code: `#lang racket

(define (square x) (* x x))
(map square '(1 2 3 4))`,
  },
  {
    id: 'lang-vhdl',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'VHDL',
    highlight: 'vhdl',
    fact: 'A hardware description language for designing digital circuits.',
    code: `entity AND_GATE is
    port (A, B : in bit; Y : out bit);
end AND_GATE;

architecture rtl of AND_GATE is
begin
    Y <= A and B;
end rtl;`,
  },
  {
    id: 'lang-tcl',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Tcl',
    highlight: 'tcl',
    fact: 'A scripting language whose name stands for "Tool Command Language".',
    code: `set total 0
foreach n {1 2 3 4 5} {
    incr total $n
}
puts $total`,
  },
  {
    id: 'lang-vb',
    category: 'language',
    type: 'code',
    prompt: 'Which language is this?',
    answer: 'Visual Basic',
    highlight: 'visual-basic',
    fact: "Microsoft's verbose, English-like language for the .NET platform.",
    code: `Module Program
    Sub Main()
        For i As Integer = 1 To 5
            Console.WriteLine(i)
        Next
    End Sub
End Module`,
  },
];

/* -------------------------------------------------------------------------- */
/*  FRAMEWORK QUESTIONS — guess the framework / library from a snippet.        */
/* -------------------------------------------------------------------------- */

const frameworks: RawQuestion[] = [
  {
    id: 'fw-react',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'React',
    highlight: 'jsx',
    fact: 'Built at Facebook; introduced the virtual DOM to the mainstream.',
    code: `function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}`,
  },
  {
    id: 'fw-vue',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Vue',
    highlight: 'html',
    fact: 'Created by Evan You, known for its approachable template syntax.',
    code: `<template>
  <button @click="count++">Count is {{ count }}</button>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>`,
  },
  {
    id: 'fw-angular',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Angular',
    highlight: 'typescript',
    fact: 'A full-featured framework maintained by Google.',
    code: `@Component({
  selector: 'app-hello',
  template: '<h1>Hello {{ name }}</h1>',
})
export class HelloComponent {
  name = 'World';
}`,
  },
  {
    id: 'fw-svelte',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Svelte',
    highlight: 'html',
    fact: 'Compiles components away — no runtime virtual DOM.',
    code: `<script>
  let count = 0;
</script>

<button on:click={() => count += 1}>
  Clicked {count} times
</button>`,
  },
  {
    id: 'fw-django',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Django',
    highlight: 'python',
    fact: 'The Python "web framework for perfectionists with deadlines".',
    code: `from django.db import models

class Article(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    published = models.DateTimeField(auto_now_add=True)`,
  },
  {
    id: 'fw-flask',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Flask',
    highlight: 'python',
    fact: 'A lightweight Python micro-framework built on Werkzeug.',
    code: `from flask import Flask
app = Flask(__name__)

@app.route("/")
def home():
    return "Hello, World!"`,
  },
  {
    id: 'fw-rails',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Ruby on Rails',
    highlight: 'ruby',
    fact: 'Convention over configuration; extracted from Basecamp.',
    code: `class ArticlesController < ApplicationController
  def index
    @articles = Article.where(published: true)
                       .order(created_at: :desc)
  end
end`,
  },
  {
    id: 'fw-express',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Express',
    highlight: 'javascript',
    fact: 'The minimalist web framework for Node.js.',
    code: `const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('Hello!'));
app.listen(3000);`,
  },
  {
    id: 'fw-spring',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Spring',
    highlight: 'java',
    fact: 'The dominant enterprise framework in the Java world.',
    code: `@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello, World!";
    }
}`,
  },
  {
    id: 'fw-laravel',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Laravel',
    highlight: 'php',
    fact: 'The most popular PHP framework, known for elegant syntax.',
    code: `<?php
Route::get('/users', function () {
    return User::where('active', 1)
        ->orderBy('name')
        ->get();
});`,
  },
  {
    id: 'fw-nextjs',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Next.js',
    highlight: 'jsx',
    fact: 'The React meta-framework built by Vercel.',
    code: `export default async function Page() {
  const data = await fetch('https://api.site/posts')
    .then((r) => r.json());
  return <ul>{data.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}`,
  },
  {
    id: 'fw-tailwind',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Tailwind CSS',
    highlight: 'html',
    fact: 'A utility-first CSS framework — style without leaving your markup.',
    code: `<div class="flex items-center gap-4 rounded-xl
            bg-slate-800 p-6 shadow-lg">
  <span class="text-lg font-bold text-emerald-400">
    Ship it
  </span>
</div>`,
  },
  {
    id: 'fw-flutter',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Flutter',
    highlight: 'dart',
    fact: "Google's UI toolkit for cross-platform apps, written in Dart.",
    code: `Widget build(BuildContext context) {
  return Scaffold(
    body: Center(
      child: Text('Hello, Flutter!'),
    ),
  );
}`,
  },
  {
    id: 'fw-jquery',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'jQuery',
    highlight: 'javascript',
    fact: 'Once on nearly every website: "write less, do more".',
    code: `$(document).ready(function () {
  $('#btn').click(function () {
    $('.box').fadeOut(300);
  });
});`,
  },
  {
    id: 'fw-fastapi',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'FastAPI',
    highlight: 'python',
    fact: 'A modern Python framework built on type hints and async.',
    code: `from fastapi import FastAPI
app = FastAPI()

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}`,
  },
  {
    id: 'fw-nestjs',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'NestJS',
    highlight: 'typescript',
    fact: 'A Node.js framework heavily inspired by Angular.',
    code: `@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This returns all cats';
  }
}`,
  },
  {
    id: 'fw-fastify',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Fastify',
    highlight: 'javascript',
    fact: 'A high-performance Node.js web framework focused on low overhead.',
    code: `const fastify = require('fastify')();

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

fastify.listen({ port: 3000 });`,
  },
  {
    id: 'fw-phoenix',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Phoenix',
    highlight: 'elixir',
    fact: 'The Elixir web framework known for real-time LiveView.',
    code: `defmodule HelloWeb.PageController do
  use HelloWeb, :controller

  def index(conn, _params) do
    render(conn, :index)
  end
end`,
  },
  {
    id: 'fw-solid',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'SolidJS',
    highlight: 'jsx',
    fact: 'Uses fine-grained reactivity with signals — no virtual DOM.',
    code: `function Counter() {
  const [count, setCount] = createSignal(0);
  return (
    <button onClick={() => setCount(count() + 1)}>
      {count()}
    </button>
  );
}`,
  },
  {
    id: 'fw-qt',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Qt',
    highlight: 'cpp',
    fact: 'A cross-platform C++ toolkit for native GUI applications.',
    code: `#include <QApplication>
#include <QPushButton>

int main(int argc, char **argv) {
    QApplication app(argc, argv);
    QPushButton button("Click me");
    button.show();
    return app.exec();
}`,
  },
  {
    id: 'fw-pytorch',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'PyTorch',
    highlight: 'python',
    fact: 'A deep-learning framework from Meta, loved for its dynamic graphs.',
    code: `import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(10, 64),
    nn.ReLU(),
    nn.Linear(64, 1),
)
out = model(torch.randn(1, 10))`,
  },
  {
    id: 'fw-symfony',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Symfony',
    highlight: 'php',
    fact: 'A mature PHP framework; many of its components power Laravel.',
    code: `<?php
class BlogController extends AbstractController
{
    #[Route('/blog', name: 'blog_list')]
    public function list(): Response
    {
        return $this->render('blog/list.html.twig');
    }
}`,
  },
  {
    id: 'fw-aspnet',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'ASP.NET Core',
    highlight: 'csharp',
    fact: "Microsoft's cross-platform framework for web apps and APIs.",
    code: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello, World!");
app.Run();`,
  },
  {
    id: 'fw-gin',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Gin',
    highlight: 'go',
    fact: 'A fast HTTP web framework for Go with a martini-like API.',
    code: `package main

import "github.com/gin-gonic/gin"

func main() {
	r := gin.Default()
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})
	r.Run()
}`,
  },
  {
    id: 'fw-bootstrap',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Bootstrap',
    highlight: 'html',
    fact: 'The grid-and-component CSS framework originally built at Twitter.',
    code: `<div class="container">
  <button type="button" class="btn btn-primary">
    Save
  </button>
  <div class="alert alert-success" role="alert">
    Saved!
  </div>
</div>`,
  },
  {
    id: 'fw-tensorflow',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'TensorFlow',
    highlight: 'python',
    fact: "Google's end-to-end machine-learning platform.",
    code: `import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation="relu"),
    tf.keras.layers.Dense(10, activation="softmax"),
])
model.compile(optimizer="adam", loss="categorical_crossentropy")`,
  },
  {
    id: 'fw-pandas',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'pandas',
    highlight: 'python',
    fact: "The go-to Python library for data analysis; named after 'panel data'.",
    code: `import pandas as pd

df = pd.read_csv("sales.csv")
totals = df.groupby("region")["amount"].sum()
print(totals.sort_values(ascending=False))`,
  },
  {
    id: 'fw-swiftui',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'SwiftUI',
    highlight: 'swift',
    fact: "Apple's declarative UI framework, announced in 2019.",
    code: `struct ContentView: View {
    var body: some View {
        VStack {
            Text("Hello, SwiftUI!")
            Button("Tap me") { print("tapped") }
        }
    }
}`,
  },
  {
    id: 'fw-compose',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Jetpack Compose',
    highlight: 'kotlin',
    fact: "Android's modern declarative UI toolkit, written in Kotlin.",
    code: `@Composable
fun Greeting(name: String) {
    Column {
        Text(text = "Hello, $name!")
        Button(onClick = { }) { Text("Click") }
    }
}`,
  },
  {
    id: 'fw-threejs',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Three.js',
    highlight: 'javascript',
    fact: 'The most popular library for 3D graphics in the browser via WebGL.',
    code: `const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);`,
  },
  {
    id: 'fw-actix',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Actix',
    highlight: 'rust',
    fact: 'A powerful, high-performance web framework for Rust.',
    code: `use actix_web::{get, App, HttpServer, Responder};

#[get("/")]
async fn hello() -> impl Responder {
    "Hello, world!"
}`,
  },
  {
    id: 'fw-electron',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Electron',
    highlight: 'javascript',
    fact: 'Builds desktop apps with web tech; powers VS Code, Slack, and Discord.',
    code: `const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 800, height: 600 });
  win.loadFile('index.html');
});`,
  },
  {
    id: 'fw-nuxt',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Nuxt',
    highlight: 'html',
    fact: 'The Vue meta-framework for server-rendered and static apps.',
    code: `<script setup>
const { data } = await useFetch('/api/posts')
</script>

<template>
  <ul>
    <li v-for="p in data" :key="p.id">{{ p.title }}</li>
  </ul>
</template>`,
  },
  {
    id: 'fw-remix',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Remix',
    highlight: 'jsx',
    fact: 'A full-stack React framework built around web standards.',
    code: `export async function loader() {
  const posts = await db.post.findMany();
  return json(posts);
}

export default function Posts() {
  const posts = useLoaderData();
  return <PostList posts={posts} />;
}`,
  },
  {
    id: 'fw-astro',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Astro',
    highlight: 'jsx',
    fact: 'Ships zero JavaScript by default with an islands architecture.',
    code: `---
const posts = await fetch('https://api.site/posts')
  .then((r) => r.json());
---
<ul>
  {posts.map((p) => <li>{p.title}</li>)}
</ul>`,
  },
  {
    id: 'fw-numpy',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'NumPy',
    highlight: 'python',
    fact: 'The foundational package for numerical computing in Python.',
    code: `import numpy as np

a = np.array([1, 2, 3, 4])
b = a.reshape(2, 2)
print(b.dot(b.T))`,
  },
  {
    id: 'fw-sklearn',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'scikit-learn',
    highlight: 'python',
    fact: 'The go-to Python library for classical machine learning.',
    code: `from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)
preds = model.predict(X_test)`,
  },
  {
    id: 'fw-streamlit',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Streamlit',
    highlight: 'python',
    fact: 'Turns plain Python scripts into shareable data apps.',
    code: `import streamlit as st

st.title("Dashboard")
name = st.text_input("Your name")
if st.button("Greet"):
    st.write(f"Hello, {name}!")`,
  },
  {
    id: 'fw-blazor',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Blazor',
    highlight: 'csharp',
    fact: 'Build interactive web UIs in C# instead of JavaScript.',
    code: `<button @onclick="Increment">Count: @count</button>

@code {
    private int count = 0;
    private void Increment() => count++;
}`,
  },
  {
    id: 'fw-axum',
    category: 'framework',
    type: 'code',
    prompt: 'Which framework / library is this?',
    answer: 'Axum',
    highlight: 'rust',
    fact: 'An ergonomic Rust web framework from the Tokio team.',
    code: `use axum::{routing::get, Router};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(|| async { "Hello" }));
}`,
  },
];

/* -------------------------------------------------------------------------- */
/*  COMPANY QUESTIONS — guess the company from its logo silhouette.            */
/*  `slug` maps to a simple-icons icon rendered as a single-color silhouette.  */
/* -------------------------------------------------------------------------- */

const companies: RawQuestion[] = [
  { id: 'co-github', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'GitHub', slug: 'github', color: '#f0f6fc', fact: 'Acquired by Microsoft in 2018 for $7.5B.' },
  { id: 'co-docker', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Docker', slug: 'docker', color: '#2496ED', fact: 'Popularized Linux containers for developers.' },
  { id: 'co-spotify', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Spotify', slug: 'spotify', color: '#1DB954', fact: 'Built much of its backend on Java and Python.' },
  { id: 'co-netflix', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Netflix', slug: 'netflix', color: '#E50914', fact: 'A pioneer of the microservices architecture.' },
  { id: 'co-jenkins', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Jenkins', slug: 'jenkins', color: '#D24939', fact: 'The veteran open-source automation server for CI/CD.' },
  { id: 'co-firebase', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Firebase', slug: 'firebase', color: '#FFCA28', fact: "Google's app platform with a realtime NoSQL database." },
  { id: 'co-google', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Google', slug: 'google', color: '#4285F4', fact: 'Created Go, Angular, Kubernetes, and TensorFlow.' },
  { id: 'co-stackoverflow', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Stack Overflow', slug: 'stackoverflow', color: '#F58025', fact: 'The Q&A site every developer has copy-pasted from.' },
  { id: 'co-mongodb', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'MongoDB', slug: 'mongodb', color: '#47A248', fact: 'A document database; the name comes from "humongous".' },
  { id: 'co-redis', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Redis', slug: 'redis', color: '#FF4438', fact: 'An in-memory data store often used for caching.' },
  { id: 'co-figma', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Figma', slug: 'figma', color: '#F24E1E', fact: 'A browser-based design tool acquired by Adobe.' },
  { id: 'co-vercel', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Vercel', slug: 'vercel', color: '#f0f6fc', fact: 'The company behind Next.js.' },
  { id: 'co-linux', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Linux', slug: 'linux', color: '#FCC624', fact: 'Tux the penguin is its mascot.' },
  { id: 'co-gitlab', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'GitLab', slug: 'gitlab', color: '#FC6D26', fact: 'A fully remote company with a famously public handbook.' },
  { id: 'co-jira', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Jira', slug: 'jira', color: '#0052CC', fact: 'Atlassian named it after Godzilla ("Gojira").' },
  { id: 'co-npm', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'npm', slug: 'npm', color: '#CB3837', fact: 'The default package manager for Node.js.' },
  { id: 'co-postgresql', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'PostgreSQL', slug: 'postgresql', color: '#4169E1', fact: 'Affectionately known as "Postgres".' },
  { id: 'co-kubernetes', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Kubernetes', slug: 'kubernetes', color: '#326CE5', fact: 'Greek for "helmsman"; often shortened to "K8s".' },
  { id: 'co-cloudflare', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Cloudflare', slug: 'cloudflare', color: '#F38020', fact: 'Runs one of the world\'s largest content delivery networks.' },
  { id: 'co-terraform', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Terraform', slug: 'terraform', color: '#7B42BC', fact: 'HashiCorp\'s tool for infrastructure as code.' },
  { id: 'co-graphql', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'GraphQL', slug: 'graphql', color: '#E10098', fact: 'A query language for APIs, created at Facebook.' },
  { id: 'co-rabbitmq', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'RabbitMQ', slug: 'rabbitmq', color: '#FF6600', fact: 'A widely used message broker built in Erlang.' },
  { id: 'co-elasticsearch', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Elasticsearch', slug: 'elasticsearch', color: '#005571', fact: 'The search engine at the heart of the ELK stack.' },
  { id: 'co-grafana', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Grafana', slug: 'grafana', color: '#F46800', fact: 'A popular open-source observability and dashboard tool.' },
  { id: 'co-prometheus', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Prometheus', slug: 'prometheus', color: '#E6522C', fact: 'A monitoring system born at SoundCloud.' },
  { id: 'co-nginx', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Nginx', slug: 'nginx', color: '#009639', fact: 'A web server and reverse proxy pronounced "engine-x".' },
  { id: 'co-supabase', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Supabase', slug: 'supabase', color: '#3FCF8E', fact: 'An open-source alternative to Firebase built on Postgres.' },
  { id: 'co-deno', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Deno', slug: 'deno', color: '#f0f6fc', fact: 'A secure JavaScript runtime from the creator of Node.js.' },
  { id: 'co-anthropic', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Anthropic', slug: 'anthropic', color: '#D97757', fact: 'The AI safety company behind the Claude family of models.' },
  { id: 'co-sentry', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Sentry', slug: 'sentry', color: '#8C5CFF', fact: 'Application monitoring that surfaces errors in real time.' },
  { id: 'co-huggingface', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Hugging Face', slug: 'huggingface', color: '#FFD21E', fact: 'The "GitHub of machine learning" — a hub for open models.' },
  { id: 'co-googlegemini', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Google Gemini', slug: 'googlegemini', color: '#886FBF', fact: "Google's flagship family of multimodal AI models." },
  { id: 'co-ollama', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Ollama', slug: 'ollama', color: '#f0f6fc', fact: 'Run large language models locally with a single command.' },
  { id: 'co-perplexity', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Perplexity', slug: 'perplexity', color: '#1FB8CD', fact: 'An AI-powered answer engine that cites its sources.' },
  { id: 'co-nvidia', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Nvidia', slug: 'nvidia', color: '#76B900', fact: 'Its GPUs power most of the world\'s AI training.' },
  { id: 'co-meta', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Meta', slug: 'meta', color: '#0467DF', fact: 'Built React and PyTorch, and the open Llama models.' },
  { id: 'co-apple', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Apple', slug: 'apple', color: '#f0f6fc', fact: 'Creator of Swift, the language for iOS and macOS apps.' },
  { id: 'co-mysql', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'MySQL', slug: 'mysql', color: '#4479A1', fact: "The world's most popular open-source relational database." },
  { id: 'co-discord', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Discord', slug: 'discord', color: '#5865F2', fact: 'A chat platform that became home to countless dev communities.' },
  { id: 'co-reddit', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Reddit', slug: 'reddit', color: '#FF4500', fact: 'Its codebase was open-sourced for many years.' },
  { id: 'co-stripe', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Stripe', slug: 'stripe', color: '#635BFF', fact: 'Developer-first payments infrastructure for the internet.' },
  { id: 'co-jetbrains', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'JetBrains', slug: 'jetbrains', color: '#f0f6fc', fact: 'Makers of IntelliJ IDEA and the Kotlin language.' },
  { id: 'co-notion', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Notion', slug: 'notion', color: '#f0f6fc', fact: 'An all-in-one workspace for notes, docs, and databases.' },
  { id: 'co-atlassian', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Atlassian', slug: 'atlassian', color: '#0052CC', fact: 'The company behind Jira, Confluence, and Bitbucket.' },
  { id: 'co-postman', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Postman', slug: 'postman', color: '#FF6C37', fact: 'The go-to tool for building and testing APIs.' },
  { id: 'co-vite', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Vite', slug: 'vite', color: '#646CFF', fact: 'A lightning-fast build tool and dev server for modern web apps.' },
  { id: 'co-webpack', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'webpack', slug: 'webpack', color: '#8DD6F9', fact: 'The module bundler that defined modern JavaScript build pipelines.' },
  { id: 'co-eslint', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'ESLint', slug: 'eslint', color: '#4B32C3', fact: 'The pluggable linter that keeps JavaScript and TypeScript tidy.' },
  { id: 'co-prettier', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Prettier', slug: 'prettier', color: '#F7B93E', fact: 'An opinionated code formatter that ends arguments about style.' },
  { id: 'co-storybook', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Storybook', slug: 'storybook', color: '#FF4785', fact: 'A workshop for building and documenting UI components in isolation.' },
  { id: 'co-jest', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Jest', slug: 'jest', color: '#C21325', fact: "Meta's 'delightful' JavaScript testing framework." },
  { id: 'co-cypress', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Cypress', slug: 'cypress', color: '#69D3A7', fact: 'An end-to-end testing tool that runs right inside the browser.' },
  { id: 'co-prisma', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Prisma', slug: 'prisma', color: '#f0f6fc', fact: 'A next-generation, type-safe ORM for Node.js and TypeScript.' },
  { id: 'co-ansible', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Ansible', slug: 'ansible', color: '#EE0000', fact: "Red Hat's agentless tool for automating configuration and deployment." },
  { id: 'co-digitalocean', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'DigitalOcean', slug: 'digitalocean', color: '#0080FF', fact: 'Developer-friendly cloud hosting; its mascot is a shark named Sammy.' },
  { id: 'co-netlify', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Netlify', slug: 'netlify', color: '#00C7B7', fact: 'A platform for deploying static sites and serverless functions.' },
  { id: 'co-githubactions', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'GitHub Actions', slug: 'githubactions', color: '#2088FF', fact: "GitHub's built-in CI/CD automation platform." },
  { id: 'co-ubuntu', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Ubuntu', slug: 'ubuntu', color: '#E95420', fact: 'The most popular desktop Linux distribution, built by Canonical.' },
  { id: 'co-firefox', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Firefox', slug: 'firefoxbrowser', color: '#FF7139', fact: "Mozilla's open-source web browser." },
  { id: 'co-telegram', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Telegram', slug: 'telegram', color: '#26A5E4', fact: 'A cloud-based messaging app with a popular bot API.' },
  { id: 'co-bun', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Bun', slug: 'bun', color: '#FBF0DF', fact: 'An all-in-one JavaScript runtime and toolkit, built for speed.' },
  { id: 'co-openai', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'OpenAI', slug: 'openai', color: '#f0f6fc', fact: 'The research lab behind ChatGPT and the GPT family of models.' },
  { id: 'co-sqlite', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'SQLite', slug: 'sqlite', color: '#003B57', fact: 'The most widely deployed database engine in the world.' },
  { id: 'co-kafka', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Apache Kafka', slug: 'apachekafka', color: '#f0f6fc', fact: 'A distributed event-streaming platform born at LinkedIn.' },
  { id: 'co-nodejs', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Node.js', slug: 'nodedotjs', color: '#5FA04E', fact: "JavaScript on the server, built on Chrome's V8 engine." },
  { id: 'co-slack', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Slack', slug: 'slack', color: '#E01E5A', fact: 'The messaging hub that became a developer workplace staple.' },
  { id: 'co-heroku', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Heroku', slug: 'heroku', color: '#79589F', fact: 'A pioneering platform-as-a-service for easy app deployment.' },
  { id: 'co-datadog', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Datadog', slug: 'datadog', color: '#632CA6', fact: 'A cloud monitoring and observability platform.' },
  { id: 'co-unity', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Unity', slug: 'unity', color: '#f0f6fc', fact: 'A cross-platform engine powering much of the games industry.' },
  { id: 'co-blender', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Blender', slug: 'blender', color: '#E87D0D', fact: 'Free and open-source 3D creation software.' },
  { id: 'co-bitbucket', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Bitbucket', slug: 'bitbucket', color: '#0052CC', fact: "Atlassian's Git hosting service for teams." },
  { id: 'co-mariadb', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'MariaDB', slug: 'mariadb', color: '#f0f6fc', fact: 'A community-driven fork of MySQL led by its original developers.' },
];

/* -------------------------------------------------------------------------- */
/*  SPOT-THE-BUG QUESTIONS — find the single broken line in a snippet.          */
/*  `bugLine` is the 1-based line number; line-number options are generated     */
/*  per game from the snippet itself.                                           */
/* -------------------------------------------------------------------------- */

const bugs: RawQuestion[] = [
  {
    id: 'bug-js-offbyone',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 3',
    bugLine: 3,
    highlight: 'javascript',
    fact: 'The loop condition `i <= arr.length` reads one index past the end — it should be `<`.',
    code: `function sum(arr) {
  let total = 0;
  for (let i = 0; i <= arr.length; i++) {
    total += arr[i];
  }
  return total;
}`,
  },
  {
    id: 'bug-py-range',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 3',
    bugLine: 3,
    highlight: 'python',
    fact: '`range(1, n)` stops at n-1, so the final factor is skipped — use `range(1, n + 1)`.',
    code: `def factorial(n):
    result = 1
    for i in range(1, n):
        result *= i
    return result`,
  },
  {
    id: 'bug-ts-assign',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 2',
    bugLine: 2,
    highlight: 'typescript',
    fact: 'A single `=` is assignment; the comparison needs `n % 2 === 0`.',
    code: `function isEven(n: number): boolean {
  if (n % 2 = 0) {
    return true;
  }
  return false;
}`,
  },
  {
    id: 'bug-js-await',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 2',
    bugLine: 2,
    highlight: 'javascript',
    fact: 'fetch() returns a Promise — line 2 needs `await`, otherwise res.json() fails.',
    code: `async function getUser(id) {
  const res = fetch(\`/api/users/\${id}\`);
  const data = await res.json();
  return data;
}`,
  },
  {
    id: 'bug-go-assign',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 9',
    bugLine: 9,
    highlight: 'go',
    fact: '`=+` assigns the positive value each iteration; you meant the `+=` operator.',
    code: `package main

import "fmt"

func main() {
	nums := []int{1, 2, 3}
	sum := 0
	for i := 0; i < len(nums); i++ {
		sum =+ nums[i]
	}
	fmt.Println(sum)
}`,
  },
  {
    id: 'bug-cs-semicolon',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 8',
    bugLine: 8,
    highlight: 'csharp',
    fact: 'The stray `;` after `if (n > max)` makes the body empty, so `max = n;` always runs.',
    code: `using System;

class Program {
    static void Main() {
        int[] nums = { 4, 8, 15, 16 };
        int max = 0;
        foreach (int n in nums) {
            if (n > max);
                max = n;
        }
        Console.WriteLine(max);
    }
}`,
  },
  {
    id: 'bug-java-intdiv',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 8',
    bugLine: 8,
    highlight: 'java',
    fact: '`sum / nums.length` is integer division — cast to `(double)` to keep the fraction.',
    code: `public class Average {
    public static void main(String[] args) {
        int[] nums = {2, 5, 6, 8};
        int sum = 0;
        for (int i = 0; i < nums.length; i++) {
            sum += nums[i];
        }
        double avg = sum / nums.length;
        System.out.println(avg);
    }
}`,
  },
  {
    id: 'bug-py-reverse',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 4',
    bugLine: 4,
    highlight: 'python',
    fact: 'On the first pass `items[len(items)]` is out of range — it should be `len(items) - 1 - i`.',
    code: `def reverse(items):
    result = []
    for i in range(len(items)):
        result.append(items[len(items) - i])
    return result`,
  },
  {
    id: 'bug-js-varclosure',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 3',
    bugLine: 3,
    highlight: 'javascript',
    fact: '`var i` is function-scoped, so every closure returns 3 — use `let i` for a per-iteration binding.',
    code: `function makeCounters() {
  const counters = [];
  for (var i = 0; i < 3; i++) {
    counters.push(() => i);
  }
  return counters;
}`,
  },
  {
    id: 'bug-c-bounds',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 5',
    bugLine: 5,
    highlight: 'c',
    fact: '`i <= 3` reads `nums[3]`, one past the end of a 3-element array — use `i < 3`.',
    code: `#include <stdio.h>

int main(void) {
    int nums[3] = {1, 2, 3};
    for (int i = 0; i <= 3; i++) {
        printf("%d\\n", nums[i]);
    }
    return 0;
}`,
  },
  {
    id: 'bug-rust-init',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 2',
    bugLine: 2,
    highlight: 'rust',
    fact: 'Seeding `largest` with 0 breaks for all-negative inputs — start from `nums[0]` or `i32::MIN`.',
    code: `fn max(nums: &[i32]) -> i32 {
    let mut largest = 0;
    for &n in nums {
        if n > largest {
            largest = n;
        }
    }
    largest
}`,
  },
  {
    id: 'bug-sql-having',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 3',
    bugLine: 3,
    highlight: 'sql',
    fact: "You can't filter an aggregate in `WHERE` — use `HAVING AVG(salary) > 50000` after `GROUP BY`.",
    code: `SELECT department, AVG(salary) AS avg_pay
FROM employees
WHERE avg_pay > 50000
GROUP BY department;`,
  },
  {
    id: 'bug-ts-optional',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 2',
    bugLine: 2,
    highlight: 'typescript',
    fact: '`name` is optional, so it can be `undefined`; calling `.toUpperCase()` on it throws at runtime.',
    code: `function greet(name?: string): string {
  return "Hello, " + name.toUpperCase();
}

console.log(greet());`,
  },
  {
    id: 'bug-py-mutdefault',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 1',
    bugLine: 1,
    highlight: 'python',
    fact: 'A mutable default `[]` is shared across calls — use `None` and create the list inside.',
    code: `def add_item(item, items=[]):
    items.append(item)
    return items

print(add_item(1))
print(add_item(2))`,
  },
  {
    id: 'bug-java-stringeq',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 5',
    bugLine: 5,
    highlight: 'java',
    fact: '`==` compares object references — use `a.equals(b)` to compare string contents.',
    code: `public class Check {
    public static void main(String[] args) {
        String a = "hi";
        String b = new String("hi");
        if (a == b) {
            System.out.println("equal");
        }
    }
}`,
  },
  {
    id: 'bug-js-sort',
    category: 'bug',
    type: 'code',
    prompt: 'Which line has the bug?',
    answer: 'Line 2',
    bugLine: 2,
    highlight: 'javascript',
    fact: 'Array.sort() sorts as strings by default — pass `(a, b) => a - b` to sort numbers.',
    code: `function sortNums(arr) {
  return arr.sort();
}

console.log(sortNums([10, 2, 1, 20]));`,
  },
];

export const ALL_QUESTIONS: RawQuestion[] = [...languages, ...frameworks, ...companies, ...bugs];

/** Distinct answer pools per category, used to generate distractor options. */
export const ANSWER_POOLS: Record<Category, string[]> = {
  language: Array.from(new Set(languages.map((q) => q.answer))),
  framework: Array.from(new Set(frameworks.map((q) => q.answer))),
  company: Array.from(new Set(companies.map((q) => q.answer))),
  // Bug questions derive their line-number options per game (see buildBugQuestion).
  bug: [],
  // Funny questions are not yet implemented; placeholder for the category.
  funny: [],
};
