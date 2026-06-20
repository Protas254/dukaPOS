import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const doc = new jsPDF();
        
        const primaryColor = [13, 110, 139];
        const accentColor = [245, 158, 11];
        const darkGray = [51, 51, 51];
        const lightGray = [128, 128, 128];

        const addHeader = (title, subtitle) => {
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 35, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 20, 18);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, 20, 26);
            
            doc.setTextColor(...darkGray);
        };

        const addSectionHeader = (title, y) => {
            doc.setFillColor(...primaryColor);
            doc.rect(20, y - 6, 170, 6, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(title, 25, y - 1.5);
            doc.setTextColor(...darkGray);
            return y + 7;
        };

        // Page 1: Cover
        addHeader('DukaPOS Brand Guide', 'Visual Identity & Marketing Guidelines');
        
        doc.setTextColor(...darkGray);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Complete Branding Guidelines for DukaPOS', 20, 52);
        
        doc.setFontSize(9);
        doc.setTextColor(...lightGray);
        doc.text('Generated: ' + new Date().toLocaleDateString(), 20, 60);
        doc.text('Prepared for: ' + user.full_name, 20, 65);
        
        let y = 75;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Table of Contents', 20, y);
        y += 10;
        
        const tocItems = [
            '1. Brand Name & Story',
            '2. Logo Concepts',
            '3. Color Palette',
            '4. Typography',
            '5. Taglines & Messaging',
            '6. Marketing Copy',
            '7. Brand Applications'
        ];
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        tocItems.forEach((item, idx) => {
            doc.text(item, 25, y + (idx * 5));
        });

        // Page 2: Brand Name & Story
        doc.addPage();
        y = 20;
        y = addSectionHeader('1. Brand Name & Story', y);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Why "DukaPOS"?', 20, y);
        y += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const brandStory = [
            '"Duka" means "shop" in Swahili, making DukaPOS the perfect name for',
            'East Africa\'s trusted point-of-sale solution. The name immediately',
            'resonates with local shop owners while clearly communicating the',
            'product\'s purpose.',
            '',
            'Brand Values:',
            '- Local: Built for Kenyan businesses, by people who understand',
            '- Trusted: Reliable, secure, always available',
            '- Simple: Easy to use, even for first-time tech users',
            '- Affordable: Accessible to small and medium businesses',
            '- Growth-focused: Helps businesses scale and succeed'
        ];
        
        brandStory.forEach((line, idx) => {
            doc.text(line, 20, y + (idx * 5));
        });
        y += brandStory.length * 5 + 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Target Audience:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        const targetAudience = [
            '- Small retail shops (dukas, kiosks, convenience stores)',
            '- Medium retailers (grocery stores, boutiques, pharmacies)',
            '- Service businesses (salons, cafes, restaurants)',
            '- Multi-location retailers seeking centralized management'
        ];
        
        targetAudience.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 5));
        });

        // Page 3: Logo Concepts
        doc.addPage();
        y = 20;
        y = addSectionHeader('2. Logo Concepts', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Concept 1: Wordmark (Recommended)', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const concept1 = [
            'Design: "DukaPOS" in bold, modern sans-serif font',
            'Color: Primary teal (#0D6E8B) with amber accent dot',
            'Style: Clean, professional, tech-forward',
            'Use case: Primary logo for all applications',
            '',
            'Why it works:',
            '- Simple and memorable',
            '- Works at any size (app icon to billboard)',
            '- No complex symbols to reproduce',
            '- Clearly communicates brand name'
        ];
        
        concept1.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += concept1.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Concept 2: Icon + Wordmark', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const concept2 = [
            'Design: Shopping bag or store icon + "DukaPOS" text',
            'Color: Teal icon, dark gray text',
            'Style: Friendly, approachable, retail-focused',
            'Use case: Marketing materials, social media',
            '',
            'Icon ideas:',
            '- Simplified shopping bag with "D" shape',
            '- Store front with awning',
            '- Abstract POS terminal with receipt'
        ];
        
        concept2.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += concept2.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Concept 3: Monogram', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const concept3 = [
            'Design: Interlocking "D" and "P" letters',
            'Color: Gradient teal to amber',
            'Style: Modern, tech startup aesthetic',
            'Use case: App icon, favicon, social profile',
            '',
            'Why consider:',
            '- Compact for small spaces',
            '- Distinctive and ownable',
            '- Works well as app icon'
        ];
        
        concept3.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += concept3.length * 4 + 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Logo Usage Guidelines:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const logoGuidelines = [
            '- Minimum size: 24px height for digital, 1cm for print',
            '- Clear space: Equal to height of "D" on all sides',
            '- Never stretch, rotate, or add effects',
            '- Use full color on white/light backgrounds only',
            '- Use reversed (white) version on dark backgrounds'
        ];
        
        logoGuidelines.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });

        // Page 4: Color Palette
        doc.addPage();
        y = 20;
        y = addSectionHeader('3. Color Palette', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Primary Colors:', 20, y);
        y += 6;
        
        doc.setFillColor(...primaryColor);
        doc.rect(25, y, 40, 15, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Teal', 30, y + 5);
        doc.text('#0D6E8B', 30, y + 10);
        
        doc.setFillColor(...accentColor);
        doc.rect(80, y, 40, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Amber', 85, y + 5);
        doc.text('#F59E0B', 85, y + 10);
        doc.setTextColor(...darkGray);
        y += 25;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Secondary Colors:', 20, y);
        y += 6;
        
        const secondaryColors = [
            ['Dark Gray', '#333333', [51, 51, 51]],
            ['Light Gray', '#808080', [128, 128, 128]],
            ['White', '#FFFFFF', [255, 255, 255]],
            ['Light Teal', '#E0F2F1', [224, 242, 241]]
        ];
        
        secondaryColors.forEach((color, idx) => {
            doc.setFillColor(...color[2]);
            doc.rect(25 + (idx * 45), y, 35, 12, 'F');
            doc.setFontSize(7);
            if (idx < 2) doc.setTextColor(255, 255, 255);
            else doc.setTextColor(...darkGray);
            doc.text(color[0], 28 + (idx * 45), y + 4);
            doc.text(color[1], 28 + (idx * 45), y + 9);
        });
        y += 22;
        
        doc.setTextColor(...darkGray);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Color Usage:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const colorUsage = [
            '- Primary (Teal): Buttons, links, headers, key UI elements',
            '- Accent (Amber): CTAs, highlights, notifications, badges',
            '- Dark Gray: Body text, labels, borders',
            '- Light Gray: Secondary text, placeholders, disabled states',
            '- White: Backgrounds, cards, content areas',
            '',
            'Accessibility:',
            '- Maintain 4.5:1 contrast ratio for text',
            '- Never use teal on amber or vice versa',
            '- Test all combinations for color blindness'
        ];
        
        colorUsage.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });

        // Page 5: Typography
        doc.addPage();
        y = 20;
        y = addSectionHeader('4. Typography', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Primary Font: Inter', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const fontInfo = [
            'Style: Clean, modern, highly readable sans-serif',
            'Use: All UI text, body copy, labels',
            'Weights: Regular (400), Medium (500), Semi-bold (600), Bold (700)',
            '',
            'Why Inter:',
            '- Designed for computer screens',
            '- Excellent readability at small sizes',
            '- Free and open-source',
            '- Professional yet approachable'
        ];
        
        fontInfo.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += fontInfo.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Heading Font: Space Grotesk', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const headingInfo = [
            'Style: Geometric, distinctive, tech-forward',
            'Use: Headlines, titles, hero sections',
            'Weights: Medium (500), Semi-bold (600), Bold (700)',
            '',
            'Why Space Grotesk:',
            '- Unique character sets brand apart',
            '- Modern, innovative feel',
            '- Pairs well with Inter',
            '- Free and open-source'
        ];
        
        headingInfo.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += headingInfo.length * 4 + 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Typography Scale:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const typeScale = [
            'H1: 32px/2rem - Page titles, hero headlines',
            'H2: 24px/1.5rem - Section headers',
            'H3: 20px/1.25rem - Subsections, card titles',
            'Body: 16px/1rem - Standard text, paragraphs',
            'Small: 14px/0.875rem - Labels, captions, helpers',
            'Tiny: 12px/0.75rem - Footnotes, timestamps',
            '',
            'Line Height: 1.5 for body, 1.2 for headings',
            'Letter Spacing: -0.02em for headings, normal for body'
        ];
        
        typeScale.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });

        // Page 6: Taglines & Messaging
        doc.addPage();
        y = 20;
        y = addSectionHeader('5. Taglines & Messaging', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Primary Tagline:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primaryColor);
        doc.text('"Powering Kenyan Businesses, One Sale at a Time"', 20, y);
        y += 10;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.text('Use case: Website hero, app store, main marketing', 25, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Alternative Taglines:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const taglines = [
            '"The Smart POS for Smart Business Owners"',
            '"From Duka to Empire - Grow with DukaPOS"',
            '"Simple POS, Serious Business"',
            '"Your Shop, Simplified"',
            '"Built for Kenya, Trusted by Thousands"',
            '"Sell More, Stress Less"',
            '"The POS That Speaks Your Language"',
            '"Modern Tools for Traditional Business"'
        ];
        
        taglines.forEach((tagline, idx) => {
            doc.text(tagline, 25, y + (idx * 5));
        });
        y += taglines.length * 5 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Messages:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const keyMessages = [
            '1. Local Focus: "Built specifically for Kenyan retailers"',
            '2. Ease of Use: "No training needed - start selling in minutes"',
            '3. Affordability: "Professional POS at a fraction of the cost"',
            '4. Reliability: "Works offline, syncs when back online"',
            '5. Compliance: "KRA eTIMS ready - stay compliant automatically"',
            '6. Growth: "From one shop to many - scale without switching"'
        ];
        
        keyMessages.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });

        // Page 7: Marketing Copy
        doc.addPage();
        y = 20;
        y = addSectionHeader('6. Marketing Copy', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Elevator Pitch (30 seconds):', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const elevatorPitch = [
            '"DukaPOS is Kenya\'s smartest point-of-sale system for small and',
            'medium retailers. In just minutes, you can replace your notebook',
            'with a professional system that tracks sales, manages inventory,',
            'handles payments, and keeps you KRA compliant. Whether you run',
            'one shop or multiple locations, DukaPOS grows with you - all at',
            'a price that makes sense for your business."'
        ];
        
        elevatorPitch.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += elevatorPitch.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Website Hero Section:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const heroCopy = [
            'Headline: "Transform Your Shop with Kenya\'s Smartest POS"',
            'Subheadline: "Join thousands of business owners who trust',
            'DukaPOS to simplify sales, track inventory, and grow revenue.',
            'No training needed. No complex setup. Just better business."',
            'CTA: "Start Free Trial" / "Watch Demo"'
        ];
        
        heroCopy.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += heroCopy.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Social Media Posts:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const socialPosts = [
            'Post 1: "Still using a notebook? Upgrade to DukaPOS and see',
            'exactly how much you\'re making every day. #DukaPOS #KenyaBusiness"',
            '',
            'Post 2: "KRA eTIMS made simple. DukaPOS automatically submits',
            'your invoices so you stay compliant without the stress."',
            '',
            'Post 3: "From 1 shop to 5 - DukaPOS scales with your success.',
            'Multi-location management has never been easier."',
            '',
            'Post 4: "Know your best-selling products, track employee',
            'performance, and make smarter decisions. That\'s DukaPOS."'
        ];
        
        socialPosts.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += socialPosts.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Email Subject Lines:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const emailSubjects = [
            '"Stop losing money - know your exact daily profit"',
            '"KRA compliance made simple (your competitors are doing this)"',
            '"From notebook to digital - upgrade in 5 minutes"',
            '"Your shop deserves better than pen and paper"',
            '"Free trial: See why 1000+ shops switched to DukaPOS"'
        ];
        
        emailSubjects.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });

        // Page 8: Brand Voice
        doc.addPage();
        y = 20;
        y = addSectionHeader('7. Brand Voice & Tone', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Brand Personality:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const personality = [
            'Friendly: Approachable, not corporate or intimidating',
            'Knowledgeable: Expert advice without condescension',
            'Encouraging: Celebrate small wins and growth',
            'Straightforward: Clear, honest, no marketing fluff',
            'Local: Use Kenyan context, examples, and language'
        ];
        
        personality.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += personality.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Do\'s and Don\'ts:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const dos = [
            'DO: Use simple language (avoid tech jargon)',
            'DO: Reference local contexts (dukas, matatus, M-Pesa)',
            'DO: Focus on benefits, not features',
            'DO: Be encouraging and supportive',
            'DO: Use active voice ("Track your sales" not "Sales tracking")'
        ];
        
        dos.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += dos.length * 4 + 6;
        
        const donts = [
            'DON\'T: Use corporate buzzwords ("synergy", "leverage")',
            'DON\'T: Talk down to users or assume ignorance',
            'DON\'T: Make unrealistic promises ("Get rich quick")',
            'DON\'T: Use overly formal or stiff language',
            'DON\'T: Copy competitors - be authentically DukaPOS'
        ];
        
        donts.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += donts.length * 4 + 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Example Comparisons:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const examples = [
            'Better: "See your sales in real-time" vs "Real-time analytics dashboard"',
            'Better: "Know what\'s selling" vs "Inventory optimization insights"',
            'Better: "Train staff in minutes" vs "Comprehensive onboarding module"',
            'Better: "Works when internet is down" vs "Offline-first architecture"'
        ];
        
        examples.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });

        // Page 9: Applications
        doc.addPage();
        y = 20;
        y = addSectionHeader('8. Brand Applications', y);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('App Icon:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const appIcon = [
            'Design: Teal background with white "D" or shopping bag icon',
            'Size: 512x512px master, scale down for all platforms',
            'Format: PNG with transparency for most uses',
            'Rounded corners: Let platform apply automatically',
            '',
            'Variations needed:',
            '- iOS: 1024x1024px (App Store), various device sizes',
            '- Android: 512x512px (Play Store), adaptive icon layers',
            '- Web: 512x512px, 192x192px, 32x32px (favicon)'
        ];
        
        appIcon.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += appIcon.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Business Cards:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const businessCard = [
            'Front: DukaPOS logo (centered), clean white background',
            'Back: Contact info, QR code to website/app',
            'Colors: White background, teal text, amber accent',
            'Finish: Matte with spot UV on logo (premium feel)',
            '',
            'Template: Standard 3.5" x 2" (88.9mm x 50.8mm)'
        ];
        
        businessCard.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += businessCard.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Social Media Templates:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const socialTemplates = [
            'Facebook: 1200x630px (posts), 820x312px (cover)',
            'Instagram: 1080x1080px (square), 1080x1350px (portrait)',
            'Twitter/X: 1200x675px (posts), 1500x500px (header)',
            'LinkedIn: 1200x627px (posts), 1584x396px (banner)',
            '',
            'Style: Teal gradient background, white text, logo watermark'
        ];
        
        socialTemplates.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += socialTemplates.length * 4 + 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Merchandise Ideas:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const merchandise = [
            '- T-shirts for staff (teal with white logo)',
            '- Shopping bags for customers (reusable, branded)',
            '- Receipt printer paper rolls (logo every 10m)',
            '- Counter displays and shelf talkers',
            '- Stickers for shop windows ("DukaPOS Accepted Here")',
            '- Calendars for customer gifts (branded, useful)'
        ];
        
        merchandise.forEach((line, idx) => {
            doc.text(line, 25, y + (idx * 4));
        });
        y += merchandise.length * 4 + 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Next Steps:', 20, y);
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...darkGray);
        const nextSteps = [
            '1. Hire designer to create final logo files (3 concepts)',
            '2. Create brand asset package (logos, fonts, templates)',
            '3. Update app icon and splash screen',
            '4. Refresh website with new branding',
            '5. Print marketing materials (cards, flyers, banners)',
            '6. Create social media content calendar',
            '7. Launch rebranding campaign'
        ];
        
        nextSteps.forEach((step, idx) => {
            doc.text(step, 25, y + (idx * 4));
        });
        
        doc.setFontSize(8);
        doc.setTextColor(...lightGray);
        doc.text('Tip: Start with logo and app icon - highest visibility items.', 20, 270);

        // Footer on all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...lightGray);
            doc.text('Page ' + i + ' of ' + pageCount, 180, 290);
            doc.text('DukaPOS Brand Guide - Confidential', 20, 290);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=DukaPOS_Brand_Guide.pdf'
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});