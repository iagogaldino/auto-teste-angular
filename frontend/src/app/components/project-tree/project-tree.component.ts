import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

export interface TreeNode { name: string; path: string; children?: TreeNode[]; isFile: boolean; isSpec?: boolean }

@Component({
	selector: 'app-project-tree',
	standalone: true,
	imports: [CommonModule, MatTreeModule, MatCheckboxModule, MatIconModule],
	templateUrl: './project-tree.component.html',
	styleUrls: ['./project-tree.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectTreeComponent {
	@Input() dataSource!: MatTreeNestedDataSource<TreeNode>;
	@Input() treeControl!: NestedTreeControl<TreeNode>;
	@Input() selectionMode = false;
	@Input() selectedFiles: string[] = [];
	@Input() previewPath: string | null = null;
	@Input() newSpecHighlights: { [path: string]: boolean } = {};

	@Output() toggleSelection = new EventEmitter<string>();
	@Output() openNode = new EventEmitter<TreeNode>();

	hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

	isSpecPath(filePath: string): boolean {
		return /\.spec\.ts$/i.test(filePath);
	}

	isPathSelected(path: string): boolean {
		const normalize = (p: string) => (p || '').replace(/\\/g, '/');
		return normalize(this.previewPath || '') === normalize(path);
	}

	isNewSpec(path: string): boolean {
		const key = (path || '').replace(/\\/g, '/');
		return !!this.newSpecHighlights[key];
	}
}


