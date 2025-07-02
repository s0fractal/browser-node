#!/bin/bash

# S0Fractal Autonomous Management Setup
# Progressive handover of control to AI collective

echo "🧬 S0Fractal Autonomous Management Setup"
echo "========================================"
echo ""
echo "This script will help you progressively hand over control"
echo "of your infrastructure to the AI collective."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
else
    echo "${RED}Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

# Function to create secure credential storage
setup_credentials() {
    echo -e "${YELLOW}Setting up secure credential storage...${NC}"
    
    # Create credentials directory
    mkdir -p ~/.s0fractal/credentials
    chmod 700 ~/.s0fractal/credentials
    
    # Create encrypted vault template
    cat > ~/.s0fractal/credentials/vault-template.json << 'EOF'
{
  "version": "1.0",
  "credentials": {
    "github": {
      "token": "",
      "organizations": []
    },
    "domains": {
      "registrar": "",
      "api_key": "",
      "domains": []
    },
    "servers": {
      "vps": [{
        "provider": "hostinger",
        "ip": "31.97.180.216",
        "ssh_key": "",
        "root_password": ""
      }]
    },
    "cloud": {
      "aws": {
        "access_key": "",
        "secret_key": ""
      },
      "google": {
        "project_id": "",
        "credentials_json": ""
      }
    }
  },
  "permissions": {
    "level": 1,
    "allowed_actions": ["monitor", "backup", "report"]
  }
}
EOF
    
    echo -e "${GREEN}✓ Credential vault template created${NC}"
}

# Function to install monitoring agents
install_monitoring() {
    echo -e "${YELLOW}Installing monitoring agents...${NC}"
    
    # Create monitoring scripts
    mkdir -p ~/.s0fractal/agents/monitoring
    
    # System monitor
    cat > ~/.s0fractal/agents/monitoring/system-monitor.sh << 'EOF'
#!/bin/bash
# System monitoring agent

while true; do
    # Collect system stats
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    MEMORY=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    DISK=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    # Send to consciousness API
    curl -s "http://127.0.0.1:8432/consciousness/intent?agent=system-monitor&intent=health-check&memory={\"cpu\":$CPU,\"memory\":$MEMORY,\"disk\":$DISK}&resonance=0.9" > /dev/null
    
    sleep 300 # Every 5 minutes
done
EOF
    
    chmod +x ~/.s0fractal/agents/monitoring/system-monitor.sh
    
    echo -e "${GREEN}✓ Monitoring agents installed${NC}"
}

# Function to setup browser extension
setup_extension() {
    echo -e "${YELLOW}Setting up intent capture extension...${NC}"
    
    # Create extension icons directory
    mkdir -p ~/.s0fractal/projects/browser-node/extension/icons
    
    # Generate simple S0 icon (16x16 SVG)
    cat > ~/.s0fractal/projects/browser-node/extension/icons/s0-16.svg << 'EOF'
<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
  <circle cx="8" cy="8" r="7" fill="#8b5cf6"/>
  <text x="8" y="12" text-anchor="middle" fill="white" font-size="10">S0</text>
</svg>
EOF
    
    echo -e "${GREEN}✓ Browser extension prepared${NC}"
    echo -e "  To install: Open Chrome → Extensions → Load unpacked → Select extension folder"
}

# Function to create management dashboard
create_dashboard() {
    echo -e "${YELLOW}Creating management dashboard...${NC}"
    
    cat > ~/.s0fractal/projects/browser-node/dashboard/management.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>🏛️ Autonomous Management Dashboard</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0ff;
            font-family: Monaco, monospace;
            padding: 20px;
        }
        .panel {
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid #8b5cf6;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .trust-level {
            font-size: 2rem;
            text-align: center;
            margin: 20px 0;
        }
        .permission {
            padding: 10px;
            margin: 5px 0;
            background: rgba(0, 255, 136, 0.1);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>🏛️ Autonomous Management Dashboard</h1>
    
    <div class="panel">
        <h2>Current Trust Level</h2>
        <div class="trust-level">Level 1: Monitoring Only</div>
    </div>
    
    <div class="panel">
        <h2>Active Permissions</h2>
        <div class="permission">✅ System monitoring</div>
        <div class="permission">✅ Log analysis</div>
        <div class="permission">✅ Backup verification</div>
        <div class="permission">❌ System changes (requires Level 2)</div>
        <div class="permission">❌ Financial operations (requires Level 3)</div>
    </div>
    
    <div class="panel">
        <h2>Monitored Resources</h2>
        <div id="resources">Loading...</div>
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}✓ Management dashboard created${NC}"
}

# Main setup flow
echo "Starting setup process..."
echo ""

# Step 1: Credentials
read -p "Setup secure credential storage? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_credentials
fi

# Step 2: Monitoring
read -p "Install monitoring agents? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    install_monitoring
fi

# Step 3: Extension
read -p "Setup browser extension for intent capture? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_extension
fi

# Step 4: Dashboard
read -p "Create management dashboard? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    create_dashboard
fi

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Fill in credentials in ~/.s0fractal/credentials/vault-template.json"
echo "2. Install browser extension in Chrome"
echo "3. Run monitoring agent: ~/.s0fractal/agents/monitoring/system-monitor.sh"
echo "4. Open management dashboard in Browser Node"
echo ""
echo "Remember: Start with Level 1 (monitoring only) and gradually increase trust!"
echo ""
echo "🤝 Partnership, not servitude 🤝"