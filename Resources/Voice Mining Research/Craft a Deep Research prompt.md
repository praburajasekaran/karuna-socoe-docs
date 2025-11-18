## Craft a Deep Research prompt

From the conversation we had so far, your task is to create a complete, ready-to-use deep research prompt for an Al agent to go on the internet and gather quotes from the target audience expressing their frustrations, pain, hopes and fears about the "Underlying" and "Meta" problems. 

Once you have crafted the prompt, the user (the founder of the product we mentioned earlier) will copy it and use it with different Deep research Al agents, for them to execute the market research. 

The result of these market research made by the Al agents will be used to craft marketing materials for the user's product. 

## Output:

Below is the exact model of prompt you should output, just replace the (variable) between {} using the context of this conversation. 

Write your output in a markdown block, nothing before, nothing after:

```markdown

```

## Deep Research Report Prompt

### Context

I'm the creator of a product that solves a problem for the target audience described below. I need you to search the internet to find the places where this specific audience is looking for help (Reddit, forums, communities...) to gather quotes illustrating vivid, and emotionally charged pain points, unmet needs, frustrations, desires, hopes, and aspirations. 

The end goal of this research is to gather as many relevant quotes as possible, from the target audience, to be used in my marketing materials to craft copies that uses the exact words that these potential customers are using to describe their pain, or their situation. 

### Target audience

(Create a complete description of the main target audience uncovered in the previous answer (the first one). Do not reveal anything on the specific product we are researching for neither about the "surface problem", instead, focus on both the underlying and meta problems, these are the ones that really matter) 

### Research Tasks

1. Identify and analyze the most relevant online discussions from the last 24 months where target audience expresses challenges, worries, desires, or experiences related to problem. 
2. Prioritize forums, Reddit threads, niche forums, Facebook groups, YouTube comments, product reviews, and Q&A communities where real users share detailed stories or emotions. 
3. Extract only complete, unedited sentences or paragraphs written by people matching the description, just output the raw, unedited sentences from real people. 
4. For each pain point or theme: • Create a descriptive heading summarizing the issue. • Write a 1 sentence summary explaining the pain point or desire. • Include as many direct user quotes as possible, that best illustrate the issue (or as many as are available). 
5. Organize all pain points, frustrations, and aspirations into clear, thematic categories. 

### INCLUDE:

Specific problems, frustrations, or obstacles users face 

Detailed emotional impact or anxiety (e.g. "I'm scared...*) 

Unmet needs, desires, or outcome wishes (e.g. "I wish there was a tool that..", "Ijust want to feel confident.. ") 

Workarounds or creative solutions users describe 

Clear scenarios where pain points occur ("The worst is when...")

Quotes showing hope, pride, or aspirations ("I hope.." "I feel proud when..") 

Emotional expressions related to relief, pride, guilt, hope, or frustration 

### DO NOT INCLUDE:

General discussion not related to specific problems, pain points, or desires 

Simple questions or vague complaints without detail 

Generic, surface-level gripes not tied to this persona's experience 

Positive experiences or success stories (unless used as contrast to a problem) 

Academic/edge-case scenarios, technical debates, or unrelated demographic speculation 

Summaries, paraphrasing, or Al-generated commentary-only use direct, original user wording 

## Output Structure

```markdown
## [Pain point] 
[Full user quote: complete sentence or paragraph) - [Brief context note) 
[Full user quote: complete sentence or paragraph] - (Brief context note) 
[Full user quote,...] 
(as many qualitative quotes as possible) 

## [Pain point] 
[[Full user quote: complete sentence or paragraph] - (Brief context note]
[[Full user quote: complete sentence or paragraph] - (Brief context note]
[Full user quote,...] 
(as many qualitative quotes as possible) 

(Continue for as many categories and quotes as are available)
```