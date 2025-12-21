# MCP Servers Migration Validation Checklist

## Pre-Deployment Validation

### Content Files ✅
- [ ] All 12 blog markdown files present in `content/mcp-servers/`
- [ ] All files have valid YAML frontmatter
- [ ] All files start with `---` delimiter
- [ ] No corrupted or truncated files

### Image Assets ✅
- [ ] All 24 image files copied to `public/images/mcp-servers/`
- [ ] No duplicate filenames causing conflicts
- [ ] File extensions preserved (.png, .jpg, .svg)

### Image References ✅
- [ ] All 19 image references updated to `/images/mcp-servers/` path
- [ ] No broken image links remaining
- [ ] No references to old `/mcp-nanobanana/` paths

### Frontmatter Quality
- [ ] All titles properly extracted
- [ ] Reading times appropriate (30 min default)
- [ ] Tags relevant to content
- [ ] Difficulty levels appropriate
- [ ] Publish dates set

### Browser Verification
- [ ] Load each blog post in browser
- [ ] Verify all images render correctly
- [ ] Check frontmatter displays in UI
- [ ] Test navigation between posts
- [ ] Verify mobile responsiveness

## Validation Commands

```bash
# Check all files have frontmatter
cd /Users/manu/Documents/LUXOR/blogs-unified/content/mcp-servers
for f in *.md; do head -1 "$f"; done

# Check image paths are updated
grep -r "!/images/" *.md | grep -v "mcp-servers"

# Count images
ls -1 ../../public/images/mcp-servers/ | wc -l

# Verify no broken links
grep -r "!\[" *.md | grep -o "(/[^)]*)"
```

## Post-Verification Actions

- [ ] Archive original `/mcp-blog-deployment/` directory
- [ ] Update unified blog system configuration
- [ ] Test build and deployment
- [ ] Update documentation references
