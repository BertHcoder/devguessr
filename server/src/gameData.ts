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
  { id: 'co-slack', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Slack', slug: 'slack', color: '#4A154B', fact: 'Started life as an internal tool for a failed game.' },
  { id: 'co-amazon', category: 'company', type: 'logo', prompt: 'Which company / brand is this?', answer: 'Amazon', slug: 'amazon', color: '#FF9900', fact: 'AWS launched in 2006 and reshaped cloud computing.' },
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
];

export const ALL_QUESTIONS: RawQuestion[] = [...languages, ...frameworks, ...companies];

/** Distinct answer pools per category, used to generate distractor options. */
export const ANSWER_POOLS: Record<Category, string[]> = {
  language: Array.from(new Set(languages.map((q) => q.answer))),
  framework: Array.from(new Set(frameworks.map((q) => q.answer))),
  company: Array.from(new Set(companies.map((q) => q.answer))),
};
