# CircularBuffer example in Angular

Dumb and ugly circular buffer just to give an example of `fast-check`.

# Caution

Peeking into the contents might cause:

- severe eye bleeding
- violent coughing fits
- stomach pains
- nausea
- emesis

Proceed at your own risk.

## Overview

[John Hughes' presentation](https://youtu.be/zi0rHwfiX1Q) had an example about circular buffers.

This repo contains a heavy-handed, dumb example of the circular buffer in angular uwing `fast-check` tests with `jest`.

I don't care about css, and angular at all. I'm only concerned with catching misbehaving code.

Don't be deterred by my sh__ code. Focus on the underlying notions.

## Serve the app

Start serving the app by:

```shell
ng serve
```

Open `http://localhost:4200/` in your browser.

Witness that the page has two weird tables.
_(two circular buffers with different capacities)_

Click around, bug them out, etc.

## Run fast-check

I refrained from `karma` and `jasmine`.

So instead, I just added `jest` and went with it.

Just do:

```
npm test
```

Then you should see something like this:

```text
CircularBuffer › should calculate the correct size if capacity is in range of [2,2] (limited search space)

    Property failed after 538 tests
    { seed: -305953337, path: "537:9:10", endOnFailure: true }
    Counterexample: [Construct(2),Put,Put,Get,Put,Size /*replayPath="ABAS:K"*/]
    Shrunk 2 time(s)
    Got error: Error: expect(received).toBe(expected) // Object.is equality

    Expected: 2
    Received: 1
```

The `Counterexample` tells us that the bug is reproducible with the following action sequence:

- Construct a circular-buffer of capacity 2
- Put 2 things in
- Get 1 thing out
- Put 1 things in
- Size should've been `2` but it was `1`

## Model based

The test itself uses the model based approach just for demonstration purposes.

In reality, the size function's correctness could be tested separately, etc.

This test is just an example of using `Commands` and a `Model`.

We can essentially do 4 things with a circular buffer:
- `Construct` one instance with a given capacity
- `Put` a value into the buffer
- `Get` a value out from the buffer
- Tell the current `Size` of the buffer

These 4 `things` are modeled as `Commands`.

To limit the search space, each `Command` has a method `check`:
```typescript
check(m: Readonly<CircularBufferModel>): boolean
```

This gets the current model, and tells whether this `Command` is applicable. This way we can prune out total dumb things (_like getting the size of a circular buffer before it was constructed_).

The `Command` has a `run` method, which mutates the real component and our model, and also does the `expect`s.

```typescript
run(m: CircularBufferModel, c: CircularBufferContext)
```

The `expect` will throw in if it fails.

Fast-check will generate a random sequence of `Commands` and execute them.

If it encounters a sequence which generates a failure, it'll try shrinking the sequence to the minimum.

So we can get the shortest sequence which can still reproduce the bug/anomaly.

Like:

```text
Counterexample: [Construct(2),Put,Put,Get,Put,Size]
```

## Pfff...this whole size calculation problem is totally self-explanatory, you could cover it with regular tests

Yep.

But... to have a test case, you first have to come up with it.

Now imagine that you have method bodies with 100+ lines of code, where you simply CANNOT reason about the code in a sound and provable fashion. And imagine that the code is 100+ years old, and has no tests.

The only thing that you're sure of is the expectation - on a pretty high-level.

In these cases it might help to come up with a simplistic model and commands and try unearthing bugs in an exploratory fashion, while you're trying to make sense of the actual code.

Also, with example based testing... you have to come up with those examples. If you are the one who wrote the code, there's a large possibility that you are biased towards your own code and you won't think about some weird dumb ways to trip up your own code. Especially if it contains crazy assumptions or implication chains (which - to be honest with you - are in my opinion common to all business logics.).

Architecture-wise the circular-buffer could be abstracted away and not coupled to html rendering. But in the real world that is rarely the case. Evertyhing is coupled to everything and I've never seen an actual real-life codebase which was even barely `clean code` (_Writing a two-liner SpringBoot project, throwing up some annotations, is not code. Of course I can write clean looking code by throwing up some annotations. This won't make my code clean, but instead it'll sweep the mess under the rug, via some outright malicious things like bytecode injection._).

## But randomly though?! And shrinking?! It is kind of meh...

Well even if you don't want to jump onto the `let's throw random junk at the algo until it breaks` train, I think the deeper concepts like `properties` and `sequencable stateless commands and lightweight models` are still valuable.

I mean as we go more and more imperative, things are more and more harder to understand, and they are more and more noisy:

```java
@Test
void test() {
  final var circularBuffer = new CircularBuffer<String>(2);
  circularBuffer.put("x");
  circularBuffer.put("y");
  assertThat(circularBuffer.get()).is("x");
  circularBuffer.put("z");
  assertThat(circularBuffer.size()).is(2);
}
```

So instead we could abstract away the smaller recurring semantical units of our tests, sequence them and apply that sequence:

```java
void test() {
  final var commands = List.of(
      Put.of("x"),
      Put.of("y"),
      Get.of(),
      Put.of("z"),
      Size.of()
    );
  Sequence
    .withModelAndReal(
      new Model(),
      new CircularBuffer<String>(2))
    .withCommands(commands)
    .execute();
}
```

You don't do the shrinking magic and the random sequence generation, but you are still able to create cases declaratively. Aka the test is only concerned about `what` and not `how`.
