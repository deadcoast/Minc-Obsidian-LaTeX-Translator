import { TFile } from 'obsidian';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    size: number;
}

interface CacheConfig {
    maxSize: number;        // Maximum cache size in bytes
    maxAge: number;         // Maximum age of cache entries in milliseconds
    cleanupInterval: number; // Cleanup interval in milliseconds
}

export class CacheManager {
    private static instance: CacheManager;
    private cache: Map<string, CacheEntry<any>> = new Map();
    private config: CacheConfig;
    private currentSize: number = 0;
    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.config = {
            maxSize: 100 * 1024 * 1024, // 100MB
            maxAge: 3600000, // 1 hour
            cleanupInterval: 300000 // 5 minutes
        };
        this.startCleanupInterval();
    }

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    public setConfig(config: Partial<CacheConfig>): void {
        this.config = { ...this.config, ...config };
        this.restartCleanupInterval();
    }

    public get<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }

        // Check if entry has expired
        if (this.isExpired(entry)) {
            this.remove(key);
            return undefined;
        }

        return entry.data;
    }

    public set<T>(key: string, data: T, size?: number): void {
        const estimatedSize = size || this.estimateSize(data);
        
        // Check if adding this item would exceed max cache size
        if (estimatedSize > this.config.maxSize) {
            console.warn('Cache entry too large:', { key, size: estimatedSize });
            return;
        }

        // Remove old entry if it exists
        if (this.cache.has(key)) {
            this.remove(key);
        }

        // Make space if needed
        this.makeSpace(estimatedSize);

        // Add new entry
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            size: estimatedSize
        };

        this.cache.set(key, entry);
        this.currentSize += estimatedSize;
    }

    public remove(key: string): void {
        const entry = this.cache.get(key);
        if (entry) {
            this.currentSize -= entry.size;
            this.cache.delete(key);
        }
    }

    public clear(): void {
        this.cache.clear();
        this.currentSize = 0;
    }

    public getCacheSize(): number {
        return this.currentSize;
    }

    public getEntryCount(): number {
        return this.cache.size;
    }

    private isExpired(entry: CacheEntry<any>): boolean {
        return Date.now() - entry.timestamp > this.config.maxAge;
    }

    private makeSpace(requiredSize: number): void {
        if (this.currentSize + requiredSize <= this.config.maxSize) {
            return;
        }

        // Sort entries by age, oldest first
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

        // Remove entries until we have enough space
        for (const [key] of entries) {
            if (this.currentSize + requiredSize <= this.config.maxSize) {
                break;
            }
            this.remove(key);
        }
    }

    private estimateSize(data: any): number {
        try {
            const str = JSON.stringify(data);
            return str.length * 2; // Approximate size in bytes (UTF-16)
        } catch (e) {
            // Fallback for non-serializable data
            return 1024; // Default to 1KB
        }
    }

    private startCleanupInterval(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }

    private restartCleanupInterval(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.startCleanupInterval();
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.maxAge) {
                this.remove(key);
            }
        }
    }

    // File-specific caching methods
    public getFileCache<T>(file: TFile, operation: string): T | undefined {
        const key = this.generateFileKey(file, operation);
        return this.get<T>(key);
    }

    public setFileCache<T>(file: TFile, operation: string, data: T): void {
        const key = this.generateFileKey(file, operation);
        this.set(key, data);
    }

    private generateFileKey(file: TFile, operation: string): string {
        return `${file.path}:${operation}:${file.stat.mtime}`;
    }

    // Batch operation caching
    public getBatchCache<T>(files: TFile[], operation: string): Map<string, T> {
        const results = new Map<string, T>();
        
        for (const file of files) {
            const cached = this.getFileCache<T>(file, operation);
            if (cached !== undefined) {
                results.set(file.path, cached);
            }
        }
        
        return results;
    }

    public setBatchCache<T>(files: TFile[], operation: string, data: Map<string, T>): void {
        for (const [path, result] of data.entries()) {
            const file = files.find(f => f.path === path);
            if (file) {
                this.setFileCache(file, operation, result);
            }
        }
    }

    // Memory pressure handling
    public handleMemoryPressure(): void {
        // Reduce cache size by 50% when under memory pressure
        const targetSize = this.currentSize / 2;
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);

        for (const [key] of entries) {
            if (this.currentSize <= targetSize) {
                break;
            }
            this.remove(key);
        }
    }

    public unload(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}
