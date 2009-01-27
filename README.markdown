RubyDie game board (Proof of Concept)
=====================================
This is simply a technology example for the tools I intend to use to implement
the game board in RubyDie. I mostly used it as a chance to learn JavaScript,
XHR, SVG, and how they all interact (along with any gotcha's therein).

I expect very little code from this example to make it into RubyDie - if
nothing else, because this code is so horrendously ugly and unmaintainable.

Using
-----
    
    rackup --port 4647 -- runner.ru
    # or
    thin --port 4647 --rackup runner.ru start
    
Now just visit <http://localhost/> and try loading the 25×25 tile
example map.