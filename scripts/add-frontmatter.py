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
        "mcp-servers": base_dir / "blogs-unified/content/mcp-servers",
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
