import { TFile, Vault } from 'obsidian';

interface ChunkMetadata {
    startLine: number;
    endLine: number;
    size: number;
    type: 'text' | 'math' | 'code' | 'mixed';
}

interface ChunkOptions {
    maxChunkSize: number;
    preserveBlocks: boolean;
    smartSplit: boolean;
}

export class FileChunker {
    private static readonly DEFAULT_CHUNK_SIZE = 50000; // 50KB
    private static readonly MATH_BLOCK_REGEX = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
    private static readonly CODE_BLOCK_REGEX = /```[\s\S]*?```/g;

    constructor(private vault: Vault) {}

    public async chunkFile(
        file: TFile,
        options: Partial<ChunkOptions> = {}
    ): Promise<{ chunks: string[]; metadata: ChunkMetadata[] }> {
        const {
            maxChunkSize = FileChunker.DEFAULT_CHUNK_SIZE,
            preserveBlocks = true,
            smartSplit = true
        } = options;

        const content = await this.vault.cachedRead(file);
        return this.createChunks(content, { maxChunkSize, preserveBlocks, smartSplit });
    }

    private createChunks(
        content: string,
        options: ChunkOptions
    ): { chunks: string[]; metadata: ChunkMetadata[] } {
        const chunks: string[] = [];
        const metadata: ChunkMetadata[] = [];

        if (!options.preserveBlocks) {
            // Simple size-based chunking
            return this.createSimpleChunks(content, options.maxChunkSize);
        }

        // Smart chunking with block preservation
        const blocks = this.identifyBlocks(content);
        let currentChunk = '';
        let currentChunkMetadata: ChunkMetadata = {
            startLine: 0,
            endLine: 0,
            size: 0,
            type: 'text'
        };

        for (const block of blocks) {
            const blockSize = block.content.length;

            if (currentChunk.length + blockSize > options.maxChunkSize && currentChunk.length > 0) {
                // Store current chunk and start a new one
                chunks.push(currentChunk);
                metadata.push(currentChunkMetadata);
                currentChunk = '';
                currentChunkMetadata = {
                    startLine: block.startLine,
                    endLine: block.endLine,
                    size: 0,
                    type: 'text'
                };
            }

            // Add block to current chunk
            currentChunk += block.content;
            currentChunkMetadata.endLine = block.endLine;
            currentChunkMetadata.size = currentChunk.length;
            currentChunkMetadata.type = this.determineChunkType(
                currentChunkMetadata.type,
                block.type
            );
        }

        // Add final chunk if not empty
        if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            metadata.push(currentChunkMetadata);
        }

        return { chunks, metadata };
    }

    private createSimpleChunks(
        content: string,
        maxChunkSize: number
    ): { chunks: string[]; metadata: ChunkMetadata[] } {
        const chunks: string[] = [];
        const metadata: ChunkMetadata[] = [];
        let currentPosition = 0;
        let lineNumber = 0;

        while (currentPosition < content.length) {
            const chunk = content.substr(currentPosition, maxChunkSize);
            const chunkLines = chunk.split('\n');
            
            chunks.push(chunk);
            metadata.push({
                startLine: lineNumber,
                endLine: lineNumber + chunkLines.length - 1,
                size: chunk.length,
                type: this.analyzeChunkType(chunk)
            });

            lineNumber += chunkLines.length;
            currentPosition += maxChunkSize;
        }

        return { chunks, metadata };
    }

    private identifyBlocks(content: string): Array<{
        content: string;
        type: 'text' | 'math' | 'code';
        startLine: number;
        endLine: number;
    }> {
        const blocks: Array<{
            content: string;
            type: 'text' | 'math' | 'code';
            startLine: number;
            endLine: number;
        }> = [];
        
        let currentPosition = 0;
        let lineNumber = 0;

        // Find all special blocks
        const specialBlocks = this.findSpecialBlocks(content);
        
        // Process content in order
        for (const block of specialBlocks) {
            // Add text before special block
            if (block.start > currentPosition) {
                const textContent = content.substring(currentPosition, block.start);
                const textLines = textContent.split('\n');
                blocks.push({
                    content: textContent,
                    type: 'text',
                    startLine: lineNumber,
                    endLine: lineNumber + textLines.length - 1
                });
                lineNumber += textLines.length;
            }

            // Add special block
            const blockLines = block.content.split('\n');
            blocks.push({
                content: block.content,
                type: block.type,
                startLine: lineNumber,
                endLine: lineNumber + blockLines.length - 1
            });
            lineNumber += blockLines.length;
            currentPosition = block.end;
        }

        // Add remaining text
        if (currentPosition < content.length) {
            const textContent = content.substring(currentPosition);
            const textLines = textContent.split('\n');
            blocks.push({
                content: textContent,
                type: 'text',
                startLine: lineNumber,
                endLine: lineNumber + textLines.length - 1
            });
        }

        return blocks;
    }

    private findSpecialBlocks(content: string): Array<{
        type: 'math' | 'code';
        content: string;
        start: number;
        end: number;
    }> {
        const blocks: Array<{
            type: 'math' | 'code';
            content: string;
            start: number;
            end: number;
        }> = [];

        // Find math blocks
        let match;
        while ((match = FileChunker.MATH_BLOCK_REGEX.exec(content)) !== null) {
            blocks.push({
                type: 'math',
                content: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        // Find code blocks
        while ((match = FileChunker.CODE_BLOCK_REGEX.exec(content)) !== null) {
            blocks.push({
                type: 'code',
                content: match[0],
                start: match.index,
                end: match.index + match[0].length
            });
        }

        // Sort blocks by start position
        return blocks.sort((a, b) => a.start - b.start);
    }

    private analyzeChunkType(chunk: string): 'text' | 'math' | 'code' | 'mixed' {
        const hasMath = FileChunker.MATH_BLOCK_REGEX.test(chunk);
        const hasCode = FileChunker.CODE_BLOCK_REGEX.test(chunk);

        if (hasMath && hasCode) return 'mixed';
        if (hasMath) return 'math';
        if (hasCode) return 'code';
        return 'text';
    }

    private determineChunkType(
        currentType: 'text' | 'math' | 'code' | 'mixed',
        newType: 'text' | 'math' | 'code'
    ): 'text' | 'math' | 'code' | 'mixed' {
        if (currentType === 'mixed') return 'mixed';
        if (currentType === newType) return currentType;
        if (currentType === 'text') return newType;
        return 'mixed';
    }

    public static async mergeChunks(
        chunks: string[],
        metadata: ChunkMetadata[]
    ): Promise<string> {
        return chunks.join('');
    }
}
