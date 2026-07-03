#!/bin/bash

echo -e "\033[0;36m🚀 Pushing Templates to Hanzo Community (Static Sites)\033[0m"

# Template list
TEMPLATES=(
    "ai-chat-interface:Modern chat UI with streaming responses"
    "ecommerce-storefront:Complete online store with cart"
    "analytics-dashboard:Data visualization dashboard"
    "saas-landing:High-converting landing page"
    "social-feed:Twitter/X-like social feed"
    "kanban-board:Trello-like task board"
    "markdown-editor:Live markdown editor"
    "crypto-portfolio:Cryptocurrency tracker"
    "blog-platform:Medium-like blog platform"
    "video-streaming:YouTube-like video platform"
)

# Build each template as static
for template_entry in "${TEMPLATES[@]}"; do
    IFS=':' read -r template description <<< "$template_entry"

    echo -e "\033[1;33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
    echo -e "\033[0;36m📝 Processing: $template\033[0m"
    echo -e "\033[0;34m   $description\033[0m"

    # Create temp directory
    TEMP_DIR="temp_static_$template"
    rm -rf $TEMP_DIR
    mkdir -p $TEMP_DIR

    # Build the template as static site
    echo "  Building static site..."

    # Copy template files
    cp -r app/templates/$template/* $TEMP_DIR/ 2>/dev/null || true
    cp -r components/ui $TEMP_DIR/components/ 2>/dev/null || mkdir -p $TEMP_DIR/components/ui && cp -r components/ui/* $TEMP_DIR/components/ui/

    # Create a simple HTML version
    cat > $TEMP_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TEMPLATE_TITLE</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body>
    <div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div class="max-w-7xl mx-auto px-4 py-16">
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold mb-4">TEMPLATE_TITLE</h1>
                <p class="text-gray-600 mb-8">TEMPLATE_DESC</p>
                <div class="flex justify-center gap-4">
                    <a href="https://hanzo.app/dev?template=https://github.com/Hanzo-Community/template-TEMPLATE_ID&action=deploy"
                       class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                        ⚡ Deploy to Hanzo
                    </a>
                    <a href="https://hanzo.app/dev?template=https://github.com/Hanzo-Community/template-TEMPLATE_ID&action=edit"
                       class="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        ✏️ Edit on Hanzo
                    </a>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow-xl p-8">
                <iframe src="preview.html" class="w-full h-[600px] rounded border"></iframe>
            </div>
        </div>
    </div>
</body>
</html>
EOF

    # Replace placeholders
    TITLE=$(echo "$template" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')
    sed -i "" "s/TEMPLATE_TITLE/$TITLE/g" $TEMP_DIR/index.html
    sed -i "" "s/TEMPLATE_DESC/$description/g" $TEMP_DIR/index.html
    sed -i "" "s/TEMPLATE_ID/$template/g" $TEMP_DIR/index.html

    # Create preview.html (simplified version of the template)
    echo "  Creating preview..."
    # For now, just copy a basic version
    echo "<div class='p-8'><h1>$TITLE Preview</h1><p>Full template available on Hanzo Cloud</p></div>" > $TEMP_DIR/preview.html

    # Create README for HF
    cat > $TEMP_DIR/README.md << EOF
---
title: $TITLE
emoji: 🎨
colorFrom: purple
colorTo: blue
sdk: static
pinned: false
---

# $TITLE

$description

## Quick Actions

- [⚡ Deploy to Hanzo](https://hanzo.app/dev?template=https://github.com/Hanzo-Community/template-$template&action=deploy)
- [✏️ Edit on Hanzo](https://hanzo.app/dev?template=https://github.com/Hanzo-Community/template-$template&action=edit)

Part of the [Hanzo Community Gallery](https://huggingface.co/spaces/hanzoai/gallery)
EOF

    # Push to HF
    echo "  Pushing to Hugging Face..."
    cd $TEMP_DIR
    git init
    git add .
    git commit -m "Deploy $template static template"
    git remote add hf https://huggingface.co/spaces/Hanzo-Community/$template
    git push -f hf main 2>/dev/null && echo -e "  \033[0;32m✅ Pushed successfully\033[0m" || echo "  ⚠️  Push failed (may need auth)"
    cd ..

    # Cleanup
    rm -rf $TEMP_DIR
done

echo -e "\033[1;33m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "\033[0;32m🎉 All templates processed!\033[0m"
echo ""
echo -e "\033[0;36mTemplates available at:\033[0m"
for template_entry in "${TEMPLATES[@]}"; do
    IFS=':' read -r template description <<< "$template_entry"
    echo -e "  \033[0;34m•\033[0m https://huggingface.co/spaces/Hanzo-Community/$template"
done
echo ""
echo -e "\033[0;36m🎨 Gallery:\033[0m https://huggingface.co/spaces/hanzoai/gallery"