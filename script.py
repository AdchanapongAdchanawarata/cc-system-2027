import sys

with open('src/app/dashboard/components/BriefDetailsModal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# The incorrect bottom row is inserted at the top. Let's find it.
start_bad = text.find('            {/* Bottom Row: Contact Info */}')
if start_bad != -1:
    end_bad = text.find('            </div> \"react\";', start_bad)
    if end_bad != -1:
        bottom_row = text[start_bad:end_bad+len('            </div>')]
        text = text[:start_bad] + text[end_bad+len('            </div> \"'):] # fix import { useState } from "react";
    else:
        print('COULD NOT FIND END OF BAD BLOCK')
        sys.exit(1)
else:
    print('COULD NOT FIND BAD BLOCK')
    sys.exit(1)

# Now find where to actually put the bottom row
# It should be after the Top Grid ends.
top_grid_end = text.find('              </div>\n\n            </div>\n\n            {/* Description Section */}')
if top_grid_end != -1:
    text = text[:top_grid_end + len('              </div>\n\n            </div>')] + '\n' + bottom_row + '\n' + text[top_grid_end + len('              </div>\n\n            </div>'):]
else:
    top_grid_end2 = text.find('              </div>\n\n            </div>\n')
    # Let's find the closing of the top grid.
    text = text.replace('              </div>\n\n            </div>', '              </div>\n\n            </div>\n' + bottom_row + '\n')

with open('src/app/dashboard/components/BriefDetailsModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('SUCCESS')
