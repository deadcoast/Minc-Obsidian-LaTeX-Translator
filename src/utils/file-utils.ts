import { TAbstractFile, TFolder } from 'obsidian';

/**
 * Type guard to check if a file is a folder
 * @param file The file to check
 * @returns True if the file is a TFolder
 */
export function isTFolder(file: TAbstractFile | null): file is TFolder {
  return file instanceof TFolder;
}
