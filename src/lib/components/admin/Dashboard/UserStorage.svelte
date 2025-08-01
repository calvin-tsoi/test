<script lang="ts">
	import { getContext } from 'svelte';
	import type { UserStorageStats } from '$lib/apis/dashboard';
	import dayjs from 'dayjs';

	const i18n = getContext('i18n');

	export let userStats: UserStorageStats[];

	const formatStorage = (mb: number) => {
		if (mb >= 1024) {
			return `${(mb / 1024).toFixed(2)} GB`;
		}
		return `${mb.toFixed(2)} MB`;
	};

	const formatDate = (timestamp: number) => {
		return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm');
	};
</script>

<div class="bg-white dark:bg-gray-900 rounded-lg shadow">
	<div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{$i18n.t('User Storage Statistics')}</h3>
		<p class="text-sm text-gray-600 dark:text-gray-400">{$i18n.t('Detailed storage usage by user')}</p>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="bg-gray-50 dark:bg-gray-800">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('User')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Storage')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Chats')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Files')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Images')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Knowledge')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Messages')}</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{$i18n.t('Last Active')}</th>
				</tr>
			</thead>
			<tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
				{#each userStats as user}
					<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center">
								<div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
									<span class="text-sm font-medium text-gray-600 dark:text-gray-300">
										{user.user_name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div class="ml-4">
									<div class="text-sm font-medium text-gray-900 dark:text-white">{user.user_name}</div>
									<div class="text-sm text-gray-500 dark:text-gray-400">{user.user_email}</div>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-semibold text-gray-900 dark:text-white">{formatStorage(user.storage_usage_mb)}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.total_chats}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.total_files}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.total_images}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.total_knowledge}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.total_messages}</td>
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(user.last_active)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>