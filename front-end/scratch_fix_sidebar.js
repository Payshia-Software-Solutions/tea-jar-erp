const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard-layout.tsx', 'utf8');

const regex1 = /<SidebarGroup className="p-0">\s*<SidebarGroupContent>\s*<SidebarMenu>\s*\{!(canSee[a-zA-Z]+) \? null : \(\s*([\s\S]*?)\s*\)\}\s*<\/SidebarMenu>\s*<\/SidebarGroupContent>\s*<\/SidebarGroup>/g;

content = content.replace(regex1, 
  (match, condition, inner) => {
    return `{!` + condition + ` ? null : (
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
` + inner + `
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            )}`;
  });

// Handle the one that has an empty line or slightly different spacing, e.g. around Accounting
const regex2 = /<SidebarGroup className="p-0">\s*<SidebarGroupContent>\s*<SidebarMenu>\s*\{!(canSee[a-zA-Z]+) \? null : \(\s*([\s\S]*?)\s*\)\}\s*<\/SidebarMenu>\s*<\/SidebarGroupContent>\s*<\/SidebarGroup>/g;
content = content.replace(regex2, 
  (match, condition, inner) => {
    return `{!` + condition + ` ? null : (
            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
` + inner + `
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            )}`;
  });

const regexAdmin = /<SidebarGroup className="mt-auto p-0">\s*<SidebarMenu>\s*\{!canSeeAdmin \? null : \(\s*([\s\S]*?)\s*\)\}\s*<\/SidebarMenu>\s*<\/SidebarGroup>/g;
content = content.replace(regexAdmin,
    `{!canSeeAdmin ? null : (
            <SidebarGroup className="mt-auto p-0">
              <SidebarMenu>
$1
              </SidebarMenu>
            </SidebarGroup>
            )}`);

fs.writeFileSync('src/components/dashboard-layout.tsx', content);
console.log("Done replacing.");
