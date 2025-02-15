import { dev } from '$app/env';
import { asyncExecShell, getEngine, version } from '$lib/common';
import { prisma } from '$lib/database';
import { defaultProxyImageHttp, defaultProxyImageTcp } from '$lib/haproxy';
export default async function () {
	const destinationDockers = await prisma.destinationDocker.findMany();
	for (const destinationDocker of destinationDockers) {
		const host = getEngine(destinationDocker.engine);
		// Cleanup old coolify images
		try {
			let { stdout: images } = await asyncExecShell(
				`DOCKER_HOST=${host} docker images coollabsio/coolify --filter before="coollabsio/coolify:${version}" -q | xargs `
			);
			images = images.trim();
			if (images) {
				await asyncExecShell(`DOCKER_HOST=${host} docker rmi -f ${images}`);
			}
		} catch (error) {
			console.log(error);
		}
		try {
			await asyncExecShell(`DOCKER_HOST=${host} docker container prune -f`);
		} catch (error) {
			console.log(error);
		}
		try {
			await asyncExecShell(`DOCKER_HOST=${host} docker image prune -f --filter "until=2h"`);
		} catch (error) {
			console.log(error);
		}
		// Tagging images with labels
		// try {
		// 	const images = [
		// 		`coollabsio/${defaultProxyImageTcp}`,
		// 		`coollabsio/${defaultProxyImageHttp}`,
		// 		'certbot/certbot:latest',
		// 		'node:16.14.0-alpine',
		// 		'alpine:latest',
		// 		'nginx:stable-alpine',
		// 		'node:lts',
		// 		'php:apache',
		// 		'rust:latest'
		// 	];
		// 	for (const image of images) {
		// 		try {
		// 			await asyncExecShell(`DOCKER_HOST=${host} docker image inspect ${image}`);
		// 		} catch (error) {
		// 			await asyncExecShell(
		// 				`DOCKER_HOST=${host} docker pull ${image} && echo "FROM ${image}" | docker build --label coolify.image="true" -t "${image}" -`
		// 			);
		// 		}
		// 	}
		// } catch (error) {}
		// if (!dev) {
		// 	// Cleanup images that are not managed by coolify
		// 	try {
		// 		await asyncExecShell(
		// 			`DOCKER_HOST=${host} docker image prune --filter 'label!=coolify.image=true' -a -f`
		// 		);
		// 	} catch (error) {
		// 		console.log(error);
		// 	}
		// 	// Cleanup old images >3 days
		// 	try {
		// 		await asyncExecShell(`DOCKER_HOST=${host} docker image prune --filter "until=72h" -a -f`);
		// 	} catch (error) {
		// 		console.log(error);
		// 	}
		// }
	}
}
