import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

// type PageProps = InferGetStaticPropsType<typeof getStaticProps>;

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {

  const { data, isLoading } = api.profile.getUserByUsername.useQuery({ username});


  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return <div>404</div>
  }

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <Layout>
        <div>{data.username}</div>
      </Layout>
    </>
  );
};

import { createProxySSGHelpers } from '@trpc/react-query/ssg';
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import Layout from "~/components/Layout";

export const getStaticProps: GetStaticProps = async (context) => {

  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson, // optional - adds superjson serialization
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") throw new Error("Slug is not a string");

  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username })

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username
    }
  }
};

export const getStaticPaths = () => {


  return {paths: [], fallback: "blocking"}
}

export default ProfilePage;
