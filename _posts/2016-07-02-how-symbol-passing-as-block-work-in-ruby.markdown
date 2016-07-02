---
layout: post
title:  "How is symbol passing as block implemented in Ruby"
date:   2016-07-02 00:03:04
summary: How, in Ruby, a symbol can be passed as a block to a method.
description: How, in Ruby, a symbol can be passed as a block to a method.
categories: ruby
---

Recently, one of the intern at my company asked me how can we pass a symbol as a block parameter to a method call in Ruby.
Let's take a look at how it is implemented in Ruby.

First thing first, a small script to help us decompile Ruby code to Ruby's bytecode instructions.

{% highlight ruby %}
#!/usr/bin/env ruby
code = ""
while (ln = gets)
  code += ln
end
iseq = RubyVM::InstructionSequence.compile(code)
puts iseq.disasm
{% endhighlight %}

To use this script, we need to provide the file name of a Ruby script. For example:

    $> echo puts "Disasm this" > test.rb
    $> disasm test.rb
    == disasm: <RubyVM::InstructionSequence:<compiled>@<compiled>>==========
    0000 trace            1                                               (  14)
    0002 putself          
    0003 putstring        "Disasm this"
    0005 opt_send_without_block <callinfo!mid:puts, argc:1, FCALL|ARGS_SIMPLE>
    0007 leave

having enough tool, let's dig into the code.

Our concern is the following code:

{% highlight ruby %}
[1, 2, -3].map(&:abs)
{% endhighlight %}

Let take a look at the compiled bytecode

    == disasm: <RubyVM::InstructionSequence:<compiled>@<compiled>>==========
    0000 trace            1                                               (   1)
    0002 duparray         [1, 2, -3]
    0004 putobject        :abs
    0006 send             <callinfo!mid:map, argc:0, ARGS_BLOCKARG>
    0008 leave

for anyone who is not familiar with these bytecodes, the above code will:

  - push `[1,2,-3]` to stack(as a receiver of method `map`)
  - push symbol `:abs` to stack(as a block argument)
  - call `send` instruction

One interesting thing here is the flag `ARGS_BLOCKARG`, which hold true when passing `&:abs` to `map`.

Let's take a look at how `send` instruction is implemented in Ruby(it is defined in __insns.def__ of Ruby's source code)

{% highlight c %}
# https://github.com/ruby/ruby/blob/v2_3_1/insns.def#L954
DEFINE_INSN
send
(CALL_INFO ci, CALL_CACHE cc, ISEQ blockiseq)
(...)
(VALUE val) // inc += - (int)(ci->orig_argc + ((ci->flag & VM_CALL_ARGS_BLOCKARG) ? 1 : 0));
{
    struct rb_calling_info calling;

    vm_caller_setup_arg_block(th, reg_cfp, &calling, ci, blockiseq, FALSE);
    vm_search_method(ci, cc, calling.recv = TOPN(calling.argc = ci->orig_argc));
    CALL_METHOD(&calling, ci, cc);
}
{% endhighlight %}

We can see that when `ARGS_BLOCKARG` flag is set(which mean we are passing a block), `ci->flag` will be set to `VM_CALL_ARGS_BLOCKARG`

Let's find the definition of `vm_caller_setup_arg_block`(it is defined in `vm_args.c`)

{% highlight c %}
# https://github.com/ruby/ruby/blob/v2_3_1/vm_args.c#L770
static void
vm_caller_setup_arg_block(const rb_thread_t *th, rb_control_frame_t *reg_cfp,
        struct rb_calling_info *calling, const struct rb_call_info *ci, rb_iseq_t *blockiseq, const int is_super)
{
    if (ci->flag & VM_CALL_ARGS_BLOCKARG) {
      rb_proc_t *po;
      VALUE proc;

      proc = *(--reg_cfp->sp);

      if (NIL_P(proc)) {
          calling->blockptr = NULL;
      }
      else if (SYMBOL_P(proc) && rb_method_basic_definition_p(rb_cSymbol, idTo_proc)) {
          calling->blockptr = RUBY_VM_GET_BLOCK_PTR_IN_CFP(reg_cfp);
          calling->blockptr->iseq = (rb_iseq_t *)proc;
          calling->blockptr->proc = proc;
      }
      else {
          if (!rb_obj_is_proc(proc)) {
            VALUE b;
            b = rb_check_convert_type(proc, T_DATA, "Proc", "to_proc");

            if (NIL_P(b) || !rb_obj_is_proc(b)) {
              rb_raise(rb_eTypeError,
                  "wrong argument type %s (expected Proc)",
                  rb_obj_classname(proc));
            }
            proc = b;
          }
          GetProcPtr(proc, po);
          calling->blockptr = &po->block;
          RUBY_VM_GET_BLOCK_PTR_IN_CFP(reg_cfp)->proc = proc;
      }
    }
  ...
}
{% endhighlight %}

Wow, lots of stuff happens here, but what draw my attention is the condition `ci->flag & VM_CALL_ARGS_BLOCKARG` which is `true` in our case.

In the middle of the `if` statements, we can see a condition to check if the passing block is a `Proc`, if it is not, a calling to function `rb_check_convert_type(proc, T_DATA, "Proc", "to_proc")` will be used.

If the passing block is not a Proc, `Symbol#to_proc` will be used to convert out symbol to Proc before going on.

So, underneath, Ruby will convert my symbol to a `Proc` and passing this as a block parameter to `map`.

## Symbol#to_proc

This method will return a Proc object which will response to the given method by symbol.

For example

{% highlight ruby %}
:abs.to_proc[-3]
=> 3
{% endhighlight %}

Therefore when we declare such as `[1,2,-3].map(&:abs)`, `:abs` will be converted to a Proc and then passing each of the element as a parameter to this `Proc`
