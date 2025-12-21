# Content Migration Plan - Unified Blog System

**Status**: Ready for execution
**Estimated Time**: 1-2 hours
**Last Updated**: 2025-12-19

---

## Overview

This document outlines the migration of **48 existing blog posts** from 4 separate blog series into the unified blog system.

**Source Locations**:
1. Context Engineering: `/blogs/context-engineering-synthesis/blogs/` (12 blogs)
2. n8n Agents: `/n8n/blogs/` (12 blogs)
3. MCP Servers: `/blogs/mcp-synthesis/` (12 blogs, verify existence)
4. Microsoft Copilot Agents: Research only (12 blogs to be written)

**Target Location**: `/blogs-unified/content/{series-id}/`

---

## Current State Analysis

### Existing Blog File Format

**Problem**: Current blogs use markdown headers instead of YAML frontmatter.

**Example (Current Format)**:
```markdown
# Blog 1: Foundational Theory & First Principles

**Series**: Context Engineering - A Comprehensive Guide
**Author**: Deep Research Agent
**Date**: 2025-12-08
**Reading Time**: 45 minutes
**Difficulty**: Advanced
```

**Required Format (YAML Frontmatter)**:
```yaml
---
title: "Foundational Theory & First Principles"
subtitle: "Understanding the theoretical foundations of context engineering"
difficulty: "Advanced"
readingTime: 45
handsOnTime: 0
learningObjectives:
  - "Understand information theory foundations"
  - "Master semantic representation principles"
  - "Design context windows effectively"
prerequisites:
  - "Basic understanding of transformer architectures"
  - "Familiarity with vector spaces"
tags:
  - "context-engineering"
  - "information-theory"
  - "foundations"
publishedDate: "2025-12-08"
---
```

---

## Migration Tasks

### Phase 1: Preparation (15 min)

**1.1 Verify Source Content**
```bash
# Count blog files in each series
echo "=== Context Engineering ===" && ls /Users/manu/Documents/LUXOR/blogs/context-engineering-synthesis/blogs/*.md | wc -l

echo "=== n8n Agents ===" && ls /Users/manu/Documents/LUXOR/n8n/blogs/*.md | wc -l

echo "=== MCP Servers ===" && ls /Users/manu/Documents/LUXOR/blogs/mcp-synthesis/*.md 2>/dev/null | wc -l
```

**1.2 Create Backup**
```bash
# Backup existing blogs before migration
cd /Users/manu/Documents/LUXOR
tar -czf blogs-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  blogs/context-engineering-synthesis/blogs \
  n8n/blogs \
  blogs/mcp-synthesis 2>/dev/null
```

### Phase 2: Frontmatter Conversion Script (30 min)

**2.1 Create Conversion Script**

Create `blogs-unified/scripts/add-frontmatter.py`:

```python
#!/usr/bin/env python3
"""
Add YAML frontmatter to existing blog markdown files.
Converts markdown headers to proper YAML frontmatter format.
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional

def parse_markdown_metadata(content: str) -> Dict:
    """Extract metadata from markdown headers."""
    metadata = {}

    # Extract title from first heading
    title_match = re.search(r'^#\s+(.+?)$', content, re.MULTILINE)
    if title_match:
        # Remove "Blog N: " prefix if present
        title = title_match.group(1)
        title = re.sub(r'^Blog\s+\d+:\s+', '', title)
        metadata['title'] = title

    # Extract other fields from bold text
    patterns = {
        'series': r'\*\*Series\*\*:\s*(.+?)$',
        'author': r'\*\*Author\*\*:\s*(.+?)$',
        'date': r'\*\*Date\*\*:\s*(.+?)$',
        'readingTime': r'\*\*Reading Time\*\*:\s*(\d+)',
        'difficulty': r'\*\*Difficulty\*\*:\s*(.+?)$',
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, content, re.MULTILINE)
        if match:
            value = match.group(1).strip()
            if key == 'readingTime':
                metadata[key] = int(value)
            else:
                metadata[key] = value

    return metadata

def extract_learning_objectives(content: str) -> List[str]:
    """Extract learning objectives from Key Insights section."""
    objectives = []

    # Find Key Insights section
    insights_match = re.search(
        r'\*\*Key Insights:\*\*\n((?:- .+\n?)+)',
        content,
        re.MULTILINE
    )

    if insights_match:
        insights_text = insights_match.group(1)
        for line in insights_text.split('\n'):
            if line.strip().startswith('- '):
                objective = line.strip()[2:]  # Remove "- " prefix
                objectives.append(objective)

    return objectives

def extract_prerequisites(content: str) -> List[str]:
    """Extract prerequisites from Prerequisites section."""
    prereqs = []

    # Find Prerequisites section
    prereq_match = re.search(
        r'## Prerequisites\n\n\*\*Required Knowledge\*\*:\n((?:- .+\n?)+)',
        content,
        re.MULTILINE | re.DOTALL
    )

    if prereq_match:
        prereq_text = prereq_match.group(1)
        for line in prereq_text.split('\n'):
            if line.strip().startswith('- '):
                prereq = line.strip()[2:]
                prereqs.append(prereq)

    return prereqs

def generate_tags(title: str, series: str, content: str) -> List[str]:
    """Generate tags from title, series, and content."""
    tags = []

    # Add series-specific tag
    if 'context engineering' in series.lower():
        tags.append('context-engineering')
    elif 'n8n' in series.lower():
        tags.append('n8n-agents')
    elif 'mcp' in series.lower():
        tags.append('mcp-servers')

    # Add common technical terms as tags
    tech_terms = [
        'rag', 'vector', 'embedding', 'retrieval', 'llm', 'ai',
        'agent', 'workflow', 'automation', 'integration', 'api'
    ]

    content_lower = content.lower()
    for term in tech_terms:
        if term in title.lower() or content_lower.count(term) > 5:
            tags.append(term)

    return tags[:5]  # Limit to 5 tags

def create_frontmatter(metadata: Dict, objectives: List[str],
                       prereqs: List[str], tags: List[str],
                       subtitle: Optional[str] = None) -> str:
    """Generate YAML frontmatter string."""

    # Generate subtitle if not provided
    if not subtitle and objectives:
        subtitle = objectives[0][:80]  # First 80 chars of first objective

    frontmatter = "---\n"
    frontmatter += f"title: \"{metadata.get('title', 'Untitled')}\"\n"
    frontmatter += f"subtitle: \"{subtitle or 'A comprehensive guide'}\"\n"
    frontmatter += f"difficulty: \"{metadata.get('difficulty', 'Intermediate')}\"\n"
    frontmatter += f"readingTime: {metadata.get('readingTime', 30)}\n"
    frontmatter += "handsOnTime: 0\n"

    # Learning objectives
    if objectives:
        frontmatter += "learningObjectives:\n"
        for obj in objectives[:5]:  # Limit to 5
            frontmatter += f"  - \"{obj}\"\n"
    else:
        frontmatter += "learningObjectives: []\n"

    # Prerequisites
    if prereqs:
        frontmatter += "prerequisites:\n"
        for prereq in prereqs[:5]:  # Limit to 5
            frontmatter += f"  - \"{prereq}\"\n"
    else:
        frontmatter += "prerequisites: []\n"

    # Tags
    if tags:
        frontmatter += "tags:\n"
        for tag in tags:
            frontmatter += f"  - \"{tag}\"\n"
    else:
        frontmatter += "tags: []\n"

    frontmatter += f"publishedDate: \"{metadata.get('date', '2025-12-08')}\"\n"
    frontmatter += "---\n\n"

    return frontmatter

def process_blog_file(input_path: Path, output_path: Path):
    """Add frontmatter to a single blog file."""

    print(f"Processing: {input_path.name}")

    # Read original content
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check if already has frontmatter
    if content.startswith('---'):
        print(f"  ✓ Already has frontmatter, skipping")
        # Just copy the file
        output_path.write_text(content, encoding='utf-8')
        return

    # Extract metadata
    metadata = parse_markdown_metadata(content)
    objectives = extract_learning_objectives(content)
    prereqs = extract_prerequisites(content)
    tags = generate_tags(
        metadata.get('title', ''),
        metadata.get('series', ''),
        content
    )

    # Generate frontmatter
    frontmatter = create_frontmatter(metadata, objectives, prereqs, tags)

    # Remove old metadata lines from content
    lines_to_remove = [
        r'^# Blog \d+:',
        r'^\*\*Series\*\*:',
        r'^\*\*Author\*\*:',
        r'^\*\*Date\*\*:',
        r'^\*\*Reading Time\*\*:',
        r'^\*\*Difficulty\*\*:',
        r'^---$'  # Remove horizontal rules at top
    ]

    content_lines = content.split('\n')
    cleaned_lines = []
    skip_empty = True  # Skip empty lines at start

    for line in content_lines:
        # Check if line should be removed
        should_remove = any(re.match(pattern, line.strip()) for pattern in lines_to_remove)

        if should_remove:
            continue

        # Skip leading empty lines
        if skip_empty and not line.strip():
            continue

        skip_empty = False
        cleaned_lines.append(line)

    cleaned_content = '\n'.join(cleaned_lines).lstrip()

    # Add title as H1 if not present
    if not cleaned_content.startswith('# '):
        title = metadata.get('title', 'Untitled')
        cleaned_content = f"# {title}\n\n{cleaned_content}"

    # Combine frontmatter + cleaned content
    final_content = frontmatter + cleaned_content

    # Write to output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(final_content, encoding='utf-8')

    print(f"  ✓ Frontmatter added: {len(objectives)} objectives, {len(prereqs)} prerequisites, {len(tags)} tags")

def process_series(input_dir: Path, output_dir: Path, series_name: str):
    """Process all blogs in a series directory."""

    print(f"\n{'='*60}")
    print(f"Processing {series_name}")
    print(f"{'='*60}")

    if not input_dir.exists():
        print(f"  ✗ Input directory not found: {input_dir}")
        return

    # Find all markdown files
    blog_files = sorted(input_dir.glob('*.md'))

    if not blog_files:
        print(f"  ✗ No markdown files found in {input_dir}")
        return

    print(f"Found {len(blog_files)} blog files")

    for blog_file in blog_files:
        output_file = output_dir / blog_file.name
        try:
            process_blog_file(blog_file, output_file)
        except Exception as e:
            print(f"  ✗ Error processing {blog_file.name}: {e}")

def main():
    """Main migration script."""

    # Define paths
    base_dir = Path("/Users/manu/Documents/LUXOR")
    output_base = base_dir / "blogs-unified" / "content"

    series_mappings = {
        "context-engineering": base_dir / "blogs/context-engineering-synthesis/blogs",
        "n8n-agents": base_dir / "n8n/blogs",
        "mcp-servers": base_dir / "blogs/mcp-synthesis/blogs",
    }

    print("Unified Blog System - Content Migration")
    print("=" * 60)

    total_processed = 0

    for series_id, input_dir in series_mappings.items():
        output_dir = output_base / series_id
        process_series(input_dir, output_dir, series_id)

        # Count processed files
        if output_dir.exists():
            count = len(list(output_dir.glob('*.md')))
            total_processed += count

    print(f"\n{'='*60}")
    print(f"Migration Complete")
    print(f"{'='*60}")
    print(f"Total blogs processed: {total_processed}")
    print(f"Output location: {output_base}")

if __name__ == "__main__":
    main()
```

**2.2 Make Script Executable**
```bash
chmod +x blogs-unified/scripts/add-frontmatter.py
```

### Phase 3: Execute Migration (15 min)

**3.1 Run Migration Script**
```bash
cd /Users/manu/Documents/LUXOR/blogs-unified
python3 scripts/add-frontmatter.py
```

**3.2 Verify Output**
```bash
# Check content was migrated
ls -l content/context-engineering/*.md | wc -l  # Should be 12
ls -l content/n8n-agents/*.md | wc -l            # Should be 12
ls -l content/mcp-servers/*.md | wc -l           # Should show count

# Inspect a sample file to verify frontmatter
head -30 content/context-engineering/01-foundational-theory.md
```

### Phase 4: Image Migration (15 min)

**4.1 Identify Image Assets**
```bash
# Find all images in existing blog projects
find /Users/manu/Documents/LUXOR/blogs/microsoft-copilot-agents/public/images -type f

find /Users/manu/Documents/LUXOR/blogs/context-engineering-synthesis -name "*.png" -o -name "*.jpg" -o -name "*.svg"

find /Users/manu/Documents/LUXOR/n8n -name "*.png" -o -name "*.jpg"
```

**4.2 Copy Images**
```bash
# Microsoft Copilot images (if any)
cp -r /Users/manu/Documents/LUXOR/blogs/microsoft-copilot-agents/public/images/* \
      /Users/manu/Documents/LUXOR/blogs-unified/public/images/microsoft-copilot-agents/ 2>/dev/null

# Context Engineering images
find /Users/manu/Documents/LUXOR/blogs/context-engineering-synthesis -name "*.png" -exec \
  cp {} /Users/manu/Documents/LUXOR/blogs-unified/public/images/context-engineering/ \;

# n8n images
cp -r /Users/manu/Documents/LUXOR/n8n/images/* \
      /Users/manu/Documents/LUXOR/blogs-unified/public/images/n8n-agents/ 2>/dev/null
```

### Phase 5: Testing (30 min)

**5.1 Install Dependencies**
```bash
cd /Users/manu/Documents/LUXOR/blogs-unified
npm install
```

**5.2 Run Development Server**
```bash
npm run dev
```

**5.3 Manual Testing Checklist**

Visit `http://localhost:3000` and verify:

- [ ] Landing page loads with series overview
- [ ] All 4 series cards appear
- [ ] Blog counts show correctly (12, 12, 12, TBD)
- [ ] Click "Context Engineering" → shows 12 blogs
- [ ] Click blog 1 → renders markdown content correctly
- [ ] Dark mode toggle works
- [ ] Images load correctly
- [ ] Navigation (prev/next) works
- [ ] Breadcrumbs function properly
- [ ] Learning objectives display
- [ ] Tags and metadata render

**5.4 Test Each Series**

For each series:
- [ ] Index page loads
- [ ] All blogs listed in order (1-12)
- [ ] Blog cards show correct metadata
- [ ] Click random blog → content renders
- [ ] Code blocks syntax highlight correctly
- [ ] External links have proper rel attributes
- [ ] Dark mode works on blog page

### Phase 6: Build & Deploy Test (15 min)

**6.1 Production Build**
```bash
npm run build
```

**6.2 Verify Build Output**
```bash
ls -la out/
ls -la out/context-engineering/
ls -la out/n8n-agents/

# Check static export includes all blogs
find out -name "*.html" | wc -l  # Should be ~40+ pages
```

**6.3 Test Static Build Locally**
```bash
npx serve out
# Visit http://localhost:3000
```

---

## Troubleshooting

### Issue: Script Fails to Parse Metadata

**Solution**: Manually inspect problematic file and adjust regex patterns in script.

### Issue: Missing Prerequisites/Objectives

**Solution**: Manually add to frontmatter after migration:
```yaml
learningObjectives:
  - "Primary learning goal"
  - "Secondary learning goal"
prerequisites:
  - "Required knowledge"
```

### Issue: Images Not Loading

**Check**:
1. Image paths in markdown (`/images/{series}/image.png`)
2. Files exist in `public/images/{series}/`
3. Build process copies `public/` to `out/`

### Issue: Frontmatter Parsing Errors

**Common causes**:
- Unescaped quotes in YAML strings
- Invalid YAML syntax
- Missing required fields

**Fix**: Wrap all string values in quotes, escape internal quotes.

---

## Success Criteria

Migration is complete when:

✅ All 36+ blog files have valid YAML frontmatter
✅ Content renders correctly in unified system
✅ Dark mode works across all pages
✅ Navigation functions properly
✅ Images load without 404 errors
✅ Production build succeeds
✅ Static export includes all pages

---

## Next Steps After Migration

1. **Content Review**: Review migrated content for formatting issues
2. **SEO Optimization**: Add meta descriptions, og:image tags
3. **Analytics**: Integrate Google Analytics or Plausible
4. **Search**: Implement search functionality
5. **Deployment**: Deploy to Vercel or Netlify

---

**Estimated Total Time**: 2 hours
**Status**: Ready to execute
**Prerequisites**: Python 3.8+, Node.js 18+, npm 9+
