import fs from 'fs';

let content = fs.readFileSync('src/lib/mock-data.ts', 'utf-8');

const mapping = {
    'comp_1': '11111111-1111-4111-a111-111111111111',
    'comp_2': '22222222-2222-4222-a222-222222222222',
    'comp_3': '33333333-3333-4333-a333-333333333333',
    'comp_4': '44444444-4444-4444-a444-444444444444',
    'comp_5': '55555555-5555-4555-a555-555555555555',
    'comp_6': '66666666-6666-4666-a666-666666666666',
    'comp_7': '77777777-7777-4777-a777-777777777777',
    'comp_8': '88888888-8888-4888-a888-888888888888',
};

for (const [key, val] of Object.entries(mapping)) {
    content = content.replace(new RegExp(key, 'g'), val);
}

fs.writeFileSync('src/lib/mock-data.ts', content);
console.log('Fixed mock-data.ts');
