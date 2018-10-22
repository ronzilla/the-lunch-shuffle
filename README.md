# The Lunch Shuffle
A mechanism for shuffling people into groups, say for lunch, coffee, or classes. The shuffler tries to match people up who haven't had lunch before, who have little in common.

## Sample Data
It uses a tab-delimited text file as input, displays the groups, and provides a file to use as input next time. A sample input file is included as SampleData.txt; it looks something like this:

First | Last | Email | Department (5) | Group (10) | Manager (20)
--- | --- | --- | --- | --- | ---
Amy | Apple | Amy Apple <example@example.com> | Dev | A | Amy
Bill | Banana | Bill Banana <example@example.com> | Dev | A | Amy
Carol | Cherry | Carol Cherry <example@example.com> | Dev | A | Art
Dill | Donut | Dill Donut <example@example.com> | Dev | A | Art
Emily | Example | Emily Example <example@example.com> | Dev | B | Bill
Frank | Fruit | Frank Fruit <example@example.com> | Dev | B | Bill
Georgie | Grapefruit | Georgie Grapefruit <example@example.com> | Dev | B | Bill
Hank | Halibut | Hank Halibut <example@example.com> | Mktg | C | Catherine
Iris | Indigo | Iris Indigo <example@example.com> | Mktg | C | Catherine
Jake | Jacobi | Jake Jacobi <example@example.com> | Mktg | C | Catherine
Kris | Kringle | Kris Kringle <example@example.com> | Mktg | D | Dee
Laurie | Lorenson | Laurie Lorenson <example@example.com> | Mktg | D | Dee
Mike | Michelson | Mike Michelson <example@example.com> | Mktg | D | Dart
Neddie | Nerf | Neddie Nerf <example@example.com> | Sales | E | Elle
Olive | Octopus | Olive Octopus <example@example.com> | Sales | E | Elle
Pat | Peters | Pat Peters <example@example.com> | Sales | E | Elle
Q | Quarf | Q Quarf <example@example.com> | Sales | F | Frank
Rafe | Reed | Rafe Reed <example@example.com> | Sales | F | Fozzie

## Sample Output
```
Group 1: 
Q Quarf <example@example.com>
Kris Kringle <example@example.com>
Dill Donut <example@example.com>
Hank Halibut <example@example.com>
Georgie Grapefruit <example@example.com>


Group 2: 
Mike Michelson <example@example.com>
Neddie Nerf <example@example.com>
Frank Fruit <example@example.com>
Rafe Reed <example@example.com>
Jake Jacobi <example@example.com>


Group 3: 
Amy Apple <example@example.com>
Olive Octopus <example@example.com>
Laurie Lorenson <example@example.com>
Bill Banana <example@example.com>


Group 4: 
Pat Peters <example@example.com>
Iris Indigo <example@example.com>
Emily Example <example@example.com>
Carol Cherry <example@example.com>
```

We want each person to meet a wide range of people, as much unlike them as possible. So people within the same Department, Group, and Manager should be separated. People with the same Manager we want to keep apart the most, so the Manager column has the highest score, at 20. People with the same Manager will get 20 mismatch points relative to each other; two people with high mismatch points will tend to not be matched up. We'd also like to minimize the total mismatch points in the system.

Be sure to save the results file once you're happy with a matchup, and use it as the input to the shuffle for next time.

## Why does this exist?
I wrote this for myself, as a simplified version of a program I run for several hundred people in a dozen or so locations. I've gotten a few requests for the source code by people who want to run similar programs at their work place, so here you go!

