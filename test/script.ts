import { join } from 'path';
import { writeFileSync } from "fs"
import { getCVPdf } from "src/services/pdf.service"

(async () => {
    const pdf = await getCVPdf('juan')
    writeFileSync(join(__dirname, 'test.pdf'), pdf)
})()