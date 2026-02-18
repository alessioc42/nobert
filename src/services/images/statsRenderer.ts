import canvas from 'canvas';

export type StatsRendererOptions = {
    persons: {
        name: string;
        displayname: string;
        avatarURL: string;
        value: number;
    }[],
    title: string;
    subtitle?: string;
}

export async function renderStats(options: StatsRendererOptions): Promise<Buffer> {
    const width = 800;
    const height = 520;
    const canvasInstance = canvas.createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');

    // Background
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, width / 2, 50);

    // Subtitle    
    if (options.subtitle) {
        ctx.font = 'italic 20px Arial';
        ctx.fillText(options.subtitle, width / 2, 80);
    }

    // Sort persons by value
    const sortedPersons = options.persons.sort((a, b) => b.value - a.value).slice(0, 5);
    const maxValue = sortedPersons[0]?.value || 1;

    // Render each person
    const avatarSize = 64;
    const padding = 20;
    const startY = 100;

    for (let i = 0; i < sortedPersons.length; i++) {
        const person = sortedPersons[i]!;
        const yPosition = startY + i * (avatarSize + padding);
        
        const barStartX = padding + avatarSize / 2;
        const barWidth = (person.value / maxValue) * (width - barStartX - padding);
        const barRadius = avatarSize / 2;
        
        // Background bar with rounded ends
        ctx.fillStyle = '#7289DA';
        ctx.beginPath();
        ctx.roundRect(barStartX, yPosition, width - barStartX - padding, avatarSize, [0, barRadius, barRadius, 0]);
        ctx.fill();
        
        // Foreground bar with rounded ends
        ctx.fillStyle = '#123edf';
        ctx.beginPath();
        ctx.roundRect(barStartX, yPosition, barWidth, avatarSize, [0, barRadius, barRadius, 0]);
        ctx.fill();

        const avatar = await canvas.loadImage(person.avatarURL);
        
        ctx.save();
        
        ctx.beginPath();
        const avatarX = padding - 1;
        const avatarY = yPosition;
        const radius = avatarSize / 2;
        ctx.arc(avatarX + radius, avatarY + radius, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        
        ctx.restore();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(person.displayname, barStartX + 40, yPosition + 40);
        ctx.textAlign = 'right';
        ctx.fillText(person.value.toString(), width - padding - 50, yPosition + 40);
    }

    return canvasInstance.toBuffer();
}

